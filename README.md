<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vision Maths - OCR System</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.6;
            background-color: #f9f9f9;
        }
        h1, h2, h3 {
            color: #333;
        }
        code, pre {
            background-color: #eee;
            padding: 10px;
            display: block;
            border-radius: 5px;
        }
        .section {
            margin-bottom: 30px;
        }
        .authors p {
            margin-bottom: 15px; /* extra space between names */
        }
    </style>
</head>
<body>

    <h1>🧠 Vision Maths – OCR Based Learning System</h1>

    <div class="section">
        <h2>📌 Overview</h2>
        <p>
            Vision Maths is an AI-based project that converts handwritten mathematical expressions 
            into digital text using OCR techniques. It is designed to assist visually impaired students 
            in learning mathematics.
        </p>
    </div>

    <div class="section">
        <h2>🚀 Features</h2>
        <ul>
            <li>Handwritten digit recognition</li>
            <li>OCR pipeline using OpenCV</li>
            <li>CNN-based classification</li>
            <li>React frontend</li>
            <li>Extendable to Braille systems</li>
        </ul>
    </div>

    <div class="section">
        <h2>🏗️ Tech Stack</h2>

        <h3>Backend</h3>
        <ul>
            <li>Python</li>
            <li>Flask</li>
            <li>OpenCV</li>
            <li>TensorFlow / Keras</li>
        </ul>

        <h3>Frontend</h3>
        <ul>
            <li>React.js</li>
            <li>HTML, CSS, JavaScript</li>
        </ul>
    </div>

    <div class="section">
        <h2>⚙️ Setup Instructions</h2>

        <h3>🔹 Backend</h3>
        <pre>
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python ocr_processor.py
        </pre>

        <h3>🔹 Frontend</h3>
        <pre>
cd frontend
npm install
npm run start
        </pre>
    </div>

    <div class="section">
        <h2>📂 Project Structure</h2>
        <pre>
Capstone-Project-main/
│── backend/
│── frontend/
│── requirements.txt
│── README.md
│── LICENSE
        </pre>
    </div>

    <div class="section">
        <h2>🎯 Use Case</h2>
        <ul>
            <li>Helps visually impaired students</li>
            <li>Converts handwritten math → digital text</li>
            <li>Can be extended to Braille</li>
        </ul>
    </div>

    <div class="section authors">
        <h2>👨‍💻 Authors</h2>
        <p>Nikhil Sharma</p>

        <p>Anushka Verma</p>

        <p>Bhavya</p>

        <p>Aryan Misra</p>

        <p>Harshit Raj</p>
    </div>

    <div class="section">
        <h2>📜 License</h2>
        <p>MIT License</p>
    </div>

</body>
</html>
