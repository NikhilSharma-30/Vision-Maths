import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { courses } from "./data";

const TestPage = () => {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [voicePrompt, setVoicePrompt] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // New states
  const [testMode, setTestMode] = useState(false); // toggled by Test Mode button (label changed below)
  const [ocrResult, setOcrResult] = useState(null); // store the result from backend for math expressions
  const [isListening, setIsListening] = useState(false); // whether speech recog is active
  const [listenedText, setListenedText] = useState(""); // store recognized speech to display

  const speak = (text) => {
    if (!text || !text.trim()) return;
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const classHandler = (e) => setSelectedClass(e.detail);
    const subjectHandler = (e) =>
      setSelectedSubject(
        e.detail.charAt(0).toUpperCase() + e.detail.slice(1).toLowerCase()
      );
    const uploadHandler = () => {
      setVoicePrompt("Say or click 'Upload Image' to continue");
    };

    window.addEventListener("voice-class", classHandler);
    window.addEventListener("voice-subject", subjectHandler);
    window.addEventListener("voice-upload", uploadHandler);

    return () => {
      window.removeEventListener("voice-class", classHandler);
      window.removeEventListener("voice-subject", subjectHandler);
      window.removeEventListener("voice-upload", uploadHandler);
    };
  }, []);
  
  useEffect(() => {
  const onKeyDown = (e) => {
    if (e.key === "q" || e.key === "Q") {
      e.preventDefault();
      setTestMode((prev) => !prev);
    }
  };

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}, []);

useEffect(() => {
  const onKeyDown = (e) => {
    if (e.key === "w" || e.key === "W") {
      e.preventDefault();
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}, []);





  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.warn("No file selected.");
      return;
    }

    setUploadedFile(file);
    setOcrText("");
    setVoicePrompt("");
    setIsLoading(true);
    setOcrResult(null); // reset previous result
    setListenedText(""); // reset previous listened text when new image uploaded

    const formData = new FormData();
    formData.append("image", file); // IMPORTANT: field name must be "image" (matches Flask)
    formData.append("mode", testMode ? "test" : "learn");

    try {
      const response = await fetch("https://vision-maths-backend.onrender.com/ocr", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("Backend response:", data);

      if (!response.ok) {
        const errMsg =
          data.error || "Something went wrong while reading the image.";
        setOcrText(errMsg);
        speak("Sorry, I could not read the image.");
        return;
      }

      // Handle Braille response
      if (data.type === "braille") {
        const text = data.text || "Braille detected.";
        setOcrText(text);
        speak(text);
        return;
      }

      // Handle CNN math expression response
      if (data.type === "math_expression_cnn") {
        const equation = data.equation || "";
        const result = data.result;

        // store actual numeric result for Speak Answer
        setOcrResult(result !== undefined ? result : null);

        let displayText = "";

        // REVERSED LOGIC: When Test Mode (button clicked) is ON (testMode === true),
        // show ONLY "expression=" (hide result).
        // When Test Mode is OFF (default), show full expression=result.
        if (testMode) {
          // Test Mode ON → show ONLY "expression="
          displayText = `${equation}=`;
        } else {
          // Test Mode OFF → show full solution
          displayText = `${equation}=${result}`;
        }

        setOcrText(displayText);
        speak(displayText);
        return;
      }

      // Fallback: if backend ever returns { text, type: "printed"/"handwritten" }
      const text = data.text || "";
      setOcrText(text);
      speak(text);
    } catch (err) {
      console.error("Error calling backend /ocr:", err);
      setOcrText("Error while connecting to the OCR server.");
      speak("Error while connecting to the OCR server.");
    } finally {
      setIsLoading(false);
    }
  };

  // helper: try parse numeric from string (returns number or null)
  const tryParseNumber = (s) => {
    if (s === null || s === undefined) return null;
    const cleaned = String(s).replace(/,/g, "").trim();
    if (/^-?\d+(\.\d+)?$/.test(cleaned)) {
      return Number(cleaned);
    }
    const n = parseFloat(cleaned);
    if (!isNaN(n)) return n;
    return null;
  };

  // Start voice recognition for "Speak Answer" check
  const handleSpeakAnswer =useCallback(() => {
    if (ocrResult === null || ocrResult === undefined) {
      speak("No result available to check.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      speak("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setListenedText("");
    setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      console.log("Recognized speech:", transcript);

      // display what was listened
      setListenedText(transcript);

      const spokenNum = tryParseNumber(transcript);
      const resultNum = tryParseNumber(ocrResult);

      setTimeout(() => {
        try {
          if (spokenNum !== null && resultNum !== null) {
            const equal = Math.abs(spokenNum - resultNum) < 1e-6;
            if (equal) {
              try {
                window.speechSynthesis.cancel();
              } catch (e) {}
              speak("Correct Answer");
            } else {
              try {
                window.speechSynthesis.cancel();
              } catch (e) {}
              speak(`Incorrect. Correct answer is ${ocrResult}`);
            }
          } else {
            const normalize = (s) =>
              String(s)
                .toLowerCase()
                .replace(/\s+/g, "")
                .replace(/,/g, "")
                .trim();
            if (normalize(transcript) === normalize(ocrResult)) {
              try {
                window.speechSynthesis.cancel();
              } catch (e) {}
              speak("Correct Answer");
            } else {
              try {
                window.speechSynthesis.cancel();
              } catch (e) {}
              speak(`Incorrect. Correct answer is ${ocrResult}`);
            }
          }
        } catch (err) {
          console.error("Error during comparison/speak:", err);
          speak("There was an error checking the answer.");
        }
      }, 50);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      speak("There was an error recognizing speech.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (err) {
      console.error("Failed to start recognition:", err);
      setIsListening(false);
      speak("Could not start speech recognition.");
    }
  },[ocrResult]);

  useEffect(() => {
  const onKeyDown = (e) => {
    if ((e.key === "e" || e.key === "E") && !isListening) {
      e.preventDefault();
      handleSpeakAnswer();
    }
  };

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}, [isListening, ocrResult,handleSpeakAnswer]);


  const filteredCourses = courses.filter((course) => {
    return (
      (selectedClass ? course.class === parseInt(selectedClass) : true) &&
      (selectedSubject ? course.subject === selectedSubject : true)
    );
  });

  return (
    <motion.div
      className="p-6 min-h-screen bg-gradient-to-bl from-blue-50 to-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-3xl font-semibold mb-6 text-blue-700">
        Take a Practice Test
      </h2>

      <motion.div
        className="flex flex-wrap gap-4 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="border border-blue-300 p-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Select Class</option>
          {[1, 2, 3, 4, 5].map((cls) => (
            <option key={cls} value={cls}>
              Class {cls}
            </option>
          ))}
        </select>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="border border-blue-300 p-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Select Subject</option>
          {["Math", "Science", "English"].map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>

        {/* BUTTON LABEL CHANGED: Test Mode */}
        <button
          onClick={() => setTestMode((prev) => !prev)}
          className={`p-2 rounded-lg shadow-sm transition border border-blue-300 ${
            testMode ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700"
          }`}
          aria-pressed={testMode}
          aria-label="Toggle Test Mode"
          style={{ minWidth: "140px" }}
        >
          {testMode ? "Test Mode: ON" : "Test Mode"}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />

        <button
          onClick={() => {
            if (fileInputRef.current) fileInputRef.current.click();
          }}
          className="border border-blue-300 p-2 rounded-lg shadow-sm text-white bg-blue-400 hover:bg-blue-500 transition"
          aria-label="Upload Image"
          style={{ minWidth: "140px" }}
        >
          {isLoading ? "Processing..." : "Upload Image"}
        </button>

        {/* Speak Answer button (same format as Upload Image button) */}
        <button
          onClick={handleSpeakAnswer}
          className="border border-blue-300 p-2 rounded-lg shadow-sm text-white bg-blue-400 hover:bg-blue-500 transition"
          aria-label="Speak Answer"
          style={{ minWidth: "140px" }}
        >
          {isListening ? "Listening..." : "Speak Answer"}
        </button>
      </motion.div>

      {voicePrompt && (
        <div className="mb-4 text-yellow-600 font-semibold">{voicePrompt}</div>
      )}

      {uploadedFile && (
        <div className="mt-4 text-green-600 font-medium">
          Uploaded File: {uploadedFile.name}
        </div>
      )}

      {ocrText && (
        <div className="mt-4 p-4 bg-gray-100 rounded text-sm text-gray-700 whitespace-pre-wrap">
          <strong>Detected Text / Expression:</strong>
          <br />
          {ocrText}
        </div>
      )}

      {/* New block showing what was listened by Speak Answer */}
      {listenedText && (
        <div className="mt-4 p-4 bg-white rounded text-sm text-gray-800 border border-slate-200">
          <strong>Heard Answer:</strong>
          <br />
          {listenedText}
        </div>
      )}

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, scale: 0.95 },
          visible: {
            opacity: 1,
            scale: 1,
            transition: {
              delayChildren: 0.3,
              staggerChildren: 0.1,
            },
          },
        }}
      >
        {filteredCourses.map((course) => (
          <motion.div
            key={course.id}
            className="p-4 bg-white rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition cursor-pointer"
            whileHover={{ scale: 1.05 }}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            onClick={() => alert(`Start test for: ${course.title}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                alert(`Start test for: ${course.title}`);
              }
            }}
          >
            <h3 className="text-lg font-bold text-blue-700">{course.title}</h3>
            <p className="text-sm text-slate-600">Class: {course.class}</p>
            <p className="text-sm text-slate-600">Subject: {course.subject}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default TestPage;
