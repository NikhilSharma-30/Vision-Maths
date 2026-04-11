import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Tesseract from "tesseract.js";
import math_1 from "./Video/math_1.mp4";

const VideoPlayerWithOCR = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { selectedClass, selectedSubject } = location.state || {};

  const [lastText, setLastText] = useState("");

  const videoSources = {
    '1_Math': math_1,
    '2_Science': 'https://www.w3schools.com/html/movie.mp4',
  };

  const videoKey = `${selectedClass}_${selectedSubject}`;
  const videoUrl = videoSources[videoKey];

  // ✅ Reliable speak function with voice readiness
  const speak = (text) => {
    const trimmed = text.trim();
    if (!trimmed || trimmed === lastText) return;

    window.speechSynthesis.cancel();

    const speakNow = () => {
      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
      setLastText(trimmed);
      console.log("🔊 Speaking:", trimmed);
    };

    // Wait for voices to load before speaking
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => speakNow();
    } else {
      speakNow();
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas) {
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        Tesseract.recognize(canvas, "eng").then(({ data: { text } }) => {
          const trimmedText = text.trim();
          console.log(" OCR Text:", trimmedText);
          speak(trimmedText);
        });
      }
    }, 2000); // Every 4 seconds

    return () => clearInterval(interval);
  }, [lastText]);

  if (!selectedClass || !selectedSubject) {
    return (
      <div className="p-6 text-red-600">
        Invalid video access.{" "}
        <button onClick={() => navigate("/learn")} className="text-blue-600 underline">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {`Class ${selectedClass} - ${selectedSubject}`} Video with OCR
      </h2>

      {videoUrl ? (
        <>
          <video
            ref={videoRef}
            controls
            autoPlay
            className="w-full max-w-3xl rounded-xl border border-gray-300 shadow"
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          <canvas
            ref={canvasRef}
            width="640"
            height="360"
            style={{ display: "none" }}
          />

          {/* 🔊 Manual test button */}
          <button
            onClick={() => speak("This is a test speech")}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
          >
            Test TTS
          </button>
        </>
      ) : (
        <p className="text-gray-600">Video coming soon for this selection.</p>
      )}

      <button
        onClick={() => navigate("/learn")}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Back to Courses
      </button>
    </div>
  );
};

export default VideoPlayerWithOCR;
