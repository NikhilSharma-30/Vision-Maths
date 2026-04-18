from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np
import cv2
import io
import requests
import tensorflow as tf  # CNN model ke liye
import threading
import os

app = Flask(__name__)
CORS(app)  # allow frontend requests from React

# ==== 1. CNN MODEL LOAD (path apne hisaab se set karo) ====
MODEL_PATH = os.path.join(os.path.dirname(__file__), "cnn_model.h5")
model = None

# index -> symbol mapping (tumhare Colab wale mapping ke hisaab se)
IDX_TO_TOKEN = {
    0: "0",
    1: "1",
    2: "2",
    3: "3",
    4: "4",
    5: "5",
    6: "6",
    7: "7",
    8: "8",
    9: "9",
    10: "-",
    11: "+",
    12: "*",
}

def send_to_pi_async(payload):
    try:
        PI_IP = "10.137.215.120"
        PI_URL = f"http://{PI_IP}:5001/expression"
        requests.post(PI_URL, json=payload, timeout=1)
    except Exception as e:
        print("Pi send ignored:", e)






def decode_image(file_data):
    """Upload se aayi bytes ko PIL Image me convert karta hai."""
    return Image.open(io.BytesIO(file_data))


# ========= CNN WALI PREPROCESSING + PREDICTION FUNCTIONS =========

def segment_symbols_from_gray(gray_img: np.ndarray):
    """
    Colab jaisa logic:
    - invert
    - threshold
    - dilation
    - contours -> bounding boxes
    - merge
    - 28x28 crops + bounding boxes
    """

    # Invert (digits white, background black)  <-- same as: inverted = ~img
    inverted = cv2.bitwise_not(gray_img)

    # Binary threshold  <-- same as Colab: THRESH_BINARY on inverted
    _, binary = cv2.threshold(inverted, 127, 255, cv2.THRESH_BINARY)

    # Dilation to connect digit parts
    kernel = np.ones((5, 5), np.uint8)
    dilated = cv2.dilate(binary, kernel, iterations=2)

    # Contours from dilated image
    contours, _ = cv2.findContours(
        dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    rects = [cv2.boundingRect(c) for c in contours]

    # Sort left to right
    rects = sorted(rects, key=lambda x: x[0])

    # Merge logic
    merged = []
    for r in rects:
        x, y, w, h = r
        merged_flag = False
        for i in range(len(merged)):
            x2, y2, w2, h2 = merged[i]

            # Horizontally overlapping or close (5px buffer)
            horizontally_close = not (x > x2 + w2 + 5 or x + w + 5 < x2)

            # Vertically aligned (column-wise)
            cx1 = x + w // 2
            cx2 = x2 + w2 // 2
            vertically_aligned = abs(cx1 - cx2) <= max(w, w2)

            if horizontally_close or vertically_aligned:
                nx = min(x, x2)
                ny = min(y, y2)
                nw = max(x + w, x2 + w2) - nx
                nh = max(y + h, y2 + h2) - ny  # y2 + h2 (correct)
                merged[i] = (nx, ny, nw, nh)
                merged_flag = True
                break

        if not merged_flag:
            merged.append((x, y, w, h))

    # Final left-to-right sort
    merged = sorted(merged, key=lambda b: b[0])

    crops = []
    boxes = []

    for (x, y, w, h) in merged:
        # Crop from binary image (jaha digits/operators clear hain)
        cropped = binary[y:y + h, x:x + w]

        # Resize to 28x28 for CNN
        resized = cv2.resize(cropped, (28, 28))

        # Colab me normalization nahi tha, isliye yahan bhi nahi
        resized = resized.astype("float32")

        # Add channel dimension -> (28, 28, 1)
        resized = resized.reshape(28, 28, 1)

        crops.append(resized)
        boxes.append((x, y, w, h))

    return crops, boxes


def predict_equation_from_crops(crops, model):
    """
    Har crop pe CNN run karke equation string banata hai,
    phir eval() se result nikalta hai.
    """
    equation = ""

    if not crops:
        return "", None

    for idx_img, img in enumerate(crops):
        x_inp = img.reshape(1, 28, 28, 1)
        preds = model.predict(x_inp, verbose=0)
        idx = int(np.argmax(preds, axis=-1)[0])

        token = IDX_TO_TOKEN.get(idx, "")
        equation += token.strip()  # strip spaces just in case

    # Basic safety: sirf yehi chars allow karo
    safe_equation = "".join(ch for ch in equation if ch in "0123456789+-*")

    try:
        result = str(eval(safe_equation)) if safe_equation else None
    except Exception:
        result = None

    return equation, result


# ===================== MAIN OCR ROUTE (ONLY CNN) =====================

@app.route("/ocr", methods=["POST"])
def process_ocr():
    global model  # 👈 IMPORTANT
    
    #LAZY LOAD MODEL HERE
    if model is None:
        MODEL_PATH = os.path.join(os.path.dirname(__file__), "cnn_model.h5")
        model = tf.keras.models.load_model(
            MODEL_PATH,
            compile=False,
            safe_mode=False
        )


    # React se "image" field aani chahiye (multipart/form-data)
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    # Read optional 'mode' from the multipart form data
    # expected values: "test" (Test Mode on) or anything else/default -> "learn"
    mode_from_client = request.form.get("mode", "").strip().lower()
    if mode_from_client == "test":
        mode = "test"
    else:
        mode = "learn"

    image_file = request.files["image"].read()
    image = decode_image(image_file)

    # PIL -> OpenCV grayscale
    gray = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2GRAY)

    # Segment symbols using Colab style logic
    crops, boxes = segment_symbols_from_gray(gray)

    if not crops:
        return jsonify({
            "error": "No symbols detected in image",
            "type": "math_expression_cnn",
            "mode": mode
        }), 400

    # Predict equation + result
    equation, result = predict_equation_from_crops(crops, model)

    if not equation:
        return jsonify({
            "error": "Could not recognize any expression",
            "type": "math_expression_cnn",
            "mode": mode
        }), 400

    # Force remove all spaces from equation & result (if any)
    if isinstance(equation, str):
        equation = equation.replace(" ", "")
    if isinstance(result, str):
        result = result.replace(" ", "")
        
    try:
        PI_IP = "10.137.215.120"
        PI_URL = f"http://{PI_IP}:5001/expression"

        payload = {
            "equation": equation,
            "result": result,
            "boxes": boxes,
            "type": "math_expression_cnn",
            "mode": mode  
        }
        threading.Thread(
        target=send_to_pi_async,
        args=(payload,),
        daemon=True
        ).start()
    except Exception as e:
        print("Error sending to Raspberry Pi:", e)
    # Response structure: React easily parse kar sakta hai
    return jsonify({
        "equation": equation,   
        "result": result,       
        "boxes": boxes,        
        "type": "math_expression_cnn",
        "mode": mode
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)


