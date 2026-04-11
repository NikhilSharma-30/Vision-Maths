import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

const ImageOCRUploader = () => {
  const [ocrText, setOcrText] = useState("");

  const speak = (text) => {
    if (!text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US"; // Change for other languages if needed
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const image = URL.createObjectURL(file);

    Tesseract.recognize(image, 'eng', {
      logger: m => console.log(m)
    }).then(({ data: { text } }) => {
      const cleanedText = text.trim();
      setOcrText(cleanedText);
      speak(cleanedText);
    }).catch(err => {
      console.error("OCR error:", err);
      speak("Sorry, I couldn't read the text.");
    });
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Upload Image for OCR</h2>
      <input type="file" accept="image/*" onChange={handleImageUpload} className="mb-4" />
      <p className="mt-4 text-gray-700">Detected Text:</p>
      <pre className="bg-gray-100 p-2 rounded">{ocrText}</pre>
    </div>
  );
};

export default ImageOCRUploader;
