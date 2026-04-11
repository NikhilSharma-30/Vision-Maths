import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { courses } from "./data";
import { useNavigate } from "react-router-dom";

function LearnPage() {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const navigate = useNavigate();

  // ================= NEW STATES (ADDED) =================
  const [difficulty, setDifficulty] = useState("easy");
  const [generatedExpression, setGeneratedExpression] = useState("");

  // ================= CIRCULAR INDEX STATE (ADDED) =================
const [questionIndex, setQuestionIndex] = useState({
  addition: { easy: 0, medium: 0, hard: 0 },
  subtraction: { easy: 0, medium: 0, hard: 0 },
  multiplication: { easy: 0, medium: 0, hard: 0 },
});


  // ================= VOICE EVENTS (ORIGINAL) =================
  useEffect(() => {
    const classHandler = (e) => setSelectedClass(e.detail);
    const subjectHandler = (e) =>
      setSelectedSubject(
        e.detail.charAt(0).toUpperCase() + e.detail.slice(1).toLowerCase()
      );

    const playHandler = () => {
      if (selectedClass && selectedSubject) {
        const hasVideo = courses.some(
          (c) =>
            c.class === parseInt(selectedClass) &&
            c.subject === selectedSubject &&
            c.videoUrl
        );
        if (hasVideo) {
          navigate("/video-player", {
            state: { selectedClass, selectedSubject },
          });
        } else {
          alert("No video available for selected class and subject.");
        }
      } else {
        alert("Please select class and subject first.");
      }
    };

    window.addEventListener("voice-class", classHandler);
    window.addEventListener("voice-subject", subjectHandler);
    window.addEventListener("voice-play-video", playHandler);

    return () => {
      window.removeEventListener("voice-class", classHandler);
      window.removeEventListener("voice-subject", subjectHandler);
      window.removeEventListener("voice-play-video", playHandler);
    };
  }, [selectedClass, selectedSubject, navigate]);

  

  // ================= SPEAK HELPER =================
  const speak = (text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  };

  // ================= SEND TO PI =================
  const sendToPi = async ({ expression, result, mode }) => {
    try {
      await fetch("http://10.137.215.120:5001/expression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ equation: expression, result, mode }),
      });
    } catch (e) {
      console.error("Error sending to Pi", e);
    }
  };

  // ================= QUESTION BANK (ADDED) =================
const QUESTION_BANK = {
  addition: {
    easy: [
      { expr: "3+5", res: "8" },
      { expr: "4+2", res: "6" },
      { expr: "7+1", res: "8" },
    ],
    medium: [
      { expr: "12+3", res: "15" },
      { expr: "24+5", res: "29" },
      { expr: "47+2", res: "49" },
    ],
    hard: [
      { expr: "12+34", res: "46" },
      { expr: "25+18", res: "43" },
      { expr: "47+22", res: "69" },
    ],
  },

  subtraction: {
    easy: [
      { expr: "7-3", res: "4" },
      { expr: "9-5", res: "4" },
      { expr: "6-2", res: "4" },
    ],
    medium: [
      { expr: "14-3", res: "11" },
      { expr: "25-7", res: "18" },
      { expr: "32-6", res: "26" },
    ],
    hard: [
      { expr: "45-23", res: "22" },
      { expr: "68-34", res: "34" },
      { expr: "90-47", res: "43" },
    ],
  },

  multiplication: {
    easy: [
      { expr: "3*2", res: "6" },
      { expr: "4*5", res: "20" },
      { expr: "6*3", res: "18" },
    ],
    medium: [
      { expr: "12*3", res: "36" },
      { expr: "24*2", res: "48" },
      { expr: "15*4", res: "60" },
    ],
    hard: [
      { expr: "123*3", res: "369" },
      { expr: "245*2", res: "490" },
      { expr: "300*2", res: "600" },
    ],
  },
};

  // ================= GENERATE MATH =================
  const generateExpression = (operation) => {
  const data = {
    addition: {
      easy: [
        "3+5=8",
        "4+2=6",
        "7+1=8",
      ],
      medium: [
        "12+3=15",
        "24+5=29",
        "47+2=49",
      ],
      hard: [
        "12+34=46",
        "25+18=43",
        "47+22=69",
      ],
    },
    subtraction: {
      easy: [
        "7-3=4",
        "9-5=4",
        "6-2=4",
      ],
      medium: [
        "14-3=11",
        "25-7=18",
        "32-6=26",
      ],
      hard: [
        "45-23=22",
        "68-34=34",
        "90-47=43",
      ],
    },
    multiplication: {
      easy: [
        "3*2=6",
        "4*5=20",
        "6*3=18",
      ],
      medium: [
        "12*3=36",
        "24*2=48",
        "15*4=60",
      ],
      hard: [
        "123*3=369",
        "245*2=490",
        "300*2=600",
      ],
    },
  };

  const idx = questionIndex[operation][difficulty];
  const list = data[operation][difficulty];
  const current = list[idx];

  const [expr, res] = current.split("=");

  setGeneratedExpression(current);
  speak(current);

  sendToPi({
    expression: expr,
    result: res,
    mode: operation,
  });

  setQuestionIndex((prev) => ({
    ...prev,
    [operation]: {
      ...prev[operation],
      [difficulty]: (idx + 1) % list.length,
    },
  }));
};

// ================= KEYBOARD SHORTCUTS =================
useEffect(() => {
  const onKeyDown = (e) => {
    switch (e.key) {
      case "1":
        e.preventDefault();
        setGeneratedExpression("01234");
        speak("zero one two three four");
        sendToPi({
          expression: "01234",
          result: "",
          mode: "basicdigit",
        });
        break;

      case "2":
        e.preventDefault();
        setGeneratedExpression("56789");
        speak("five six seven eight nine");
        sendToPi({
          expression: "56789",
          result: "",
          mode: "advancedigit",
        });
        break;

      case "3":
        e.preventDefault();
        setGeneratedExpression("+-*");
        speak("plus minus multiply");
        sendToPi({
          expression: "+-*",
          result: "",
          mode: "operations",
        });
        break;

      case "4":
        e.preventDefault();
        setDifficulty("easy");
        speak("Easy selected");
        break;

      case "5":
        e.preventDefault();
        setDifficulty("medium");
        speak("Medium selected");
        break;

      case "6":
        e.preventDefault();
        setDifficulty("hard");
        speak("Hard selected");
        break;

      case "7":
        e.preventDefault();
        generateExpression("addition");
        break;

      case "8":
        e.preventDefault();
        generateExpression("subtraction");
        break;

      case "9":
        e.preventDefault();
        generateExpression("multiplication");
        break;

      default:
        break;
    }
  };

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}, [generateExpression]);

  // ================= FILTER COURSES (ORIGINAL) =================
  const filteredCourses = courses.filter((course) => {
    return (
      (selectedClass ? course.class === parseInt(selectedClass) : true) &&
      (selectedSubject ? course.subject === selectedSubject : true)
    );
  });

  const handleCourseClick = (course) => {
    if (course.videoUrl) {
      navigate("/video-player", {
        state: {
          selectedClass: course.class,
          selectedSubject: course.subject,
        },
      });
    } else {
      alert("No video available for this course yet.");
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-sky-50 to-white">
      <motion.h2
        className="text-3xl font-semibold mb-6 text-sky-700"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Browse Courses
      </motion.h2>

      {/* ================= CLASS & SUBJECT DROPDOWNS ================= */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="border border-sky-300 p-2 rounded-lg"
        >
          <option value="">All Classes</option>
          {[1, 2, 3, 4, 5].map((cls) => (
            <option key={cls} value={cls}>
              Class {cls}
            </option>
          ))}
        </select>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="border border-sky-300 p-2 rounded-lg"
        >
          <option value="">All Subjects</option>
          {["Math", "Science", "English"].map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>
      </div>

      {/* ================= NEW LEARN MODE SECTION ================= */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          className="bg-sky-300 text-white h-12 rounded"
          onClick={() => {
            setGeneratedExpression("01234");
            speak("zero one two three four");
            sendToPi({
              expression: "01234",
              result: "",
              mode: "basicdigit",
            });
          }}
        >
          Basic Digit
        </button>

        <button
          className="bg-sky-300 text-white h-12 rounded"
          onClick={() => {
            setGeneratedExpression("56789");
            speak("five six seven eight nine");
            sendToPi({
              expression: "56789",
              result: "",
              mode: "advancedigit",
            });
          }}
        >
          Advance Digit
        </button>

        <button
          className="bg-sky-300 text-white h-12 rounded"
          onClick={() => {
            setGeneratedExpression("+-*");
            speak("plus minus multiply");
            sendToPi({
              expression: "+-*",
              result: "",
              mode: "operations",
            });
          }}
        >
          Operations
        </button>
        
        <button
          className={`h-12 rounded font-bold border transition
            ${difficulty === "easy"
              ? "bg-sky-400 text-green-700 border-green-500"
              : "bg-sky-100 text-green-600 border-transparent"}
          `}
          onClick={() => setDifficulty("easy")}
        >
          {difficulty === "easy" ? "Easy ✓" : "Easy"}
        </button>

        <button
          className={`h-12 rounded font-bold border transition
            ${difficulty === "medium"
              ? "bg-sky-400 text-yellow-700 border-yellow-500"
              : "bg-sky-100 text-yellow-600 border-transparent"}
          `}
          onClick={() => setDifficulty("medium")}
        >
          {difficulty === "medium" ? "Medium ✓" : "Medium"}
        </button>

        <button
          className={`h-12 rounded font-bold border transition
            ${difficulty === "hard"
              ? "bg-sky-400 text-red-700 border-red-500"
              : "bg-sky-100 text-red-600 border-transparent"}
          `}
          onClick={() => setDifficulty("hard")}
        >
          {difficulty === "hard" ? "Hard ✓" : "Hard"}
        </button>

        <button
          className="bg-sky-300 h-12 rounded text-blue-700 font-semibold"
          onClick={() => generateExpression("addition")}
        >
          Addition
        </button>

        <button
          className="bg-sky-300 h-12 rounded text-blue-700 font-semibold"
          onClick={() => generateExpression("subtraction")}
        >
          Subtraction
        </button>

        <button
          className="bg-sky-300 h-12 rounded text-blue-700 font-semibold"
          onClick={() => generateExpression("multiplication")}
        >
          Multiplication
        </button>
      </div>

      {/* ================= DISPLAY BOX ================= */}
      {generatedExpression && (
        <div className="border-2 border-sky-400 rounded-lg p-4 mb-8 bg-white">
          <div className="text-sm font-semibold text-sky-600 mb-1">
            Displayed Equation
          </div>
          <div className="text-xl font-bold">{generatedExpression}</div>
        </div>
      )}

      {/* ================= ORIGINAL COURSE CARDS ================= */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
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
            onClick={() => handleCourseClick(course)}
          >
            <h3 className="text-lg font-bold text-sky-700">
              {course.title}
            </h3>
            <p className="text-sm text-slate-600">
              Class: {course.class}
            </p>
            <p className="text-sm text-slate-600">
              Subject: {course.subject}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export default LearnPage;
