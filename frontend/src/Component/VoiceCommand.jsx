import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import done from "./sound/done.mp3";

const VoiceCommand = () => {
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const speak = (text) => {
  const msg = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(msg);
};


  useEffect(() => {
    const msg = new SpeechSynthesisUtterance(
      "Welcome to VisionMath. Please press any key or click to activate sound feedback for voice commands."
    );
    window.speechSynthesis.speak(msg);
  }, []);

  useEffect(() => {
    const unlockAudio = () => {
      console.log("Trying to unlock audio...");
      if (audioRef.current && !audioUnlocked) {
        audioRef.current
          .play()
          .then(() => {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setAudioUnlocked(true);
            console.log("✅ Audio unlocked");
          })
          .catch((err) => {
            console.warn("⚠️ Failed to unlock audio:", err);
          });
      }
    };

    document.addEventListener("click", unlockAudio);
    document.addEventListener("keydown", unlockAudio);

    return () => {
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("keydown", unlockAudio);
    };
  }, [audioUnlocked]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "en-US";

    const playSuccessSound = () => {
      if (audioRef.current && audioUnlocked) {
        console.log("🔈 Playing success sound...");
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => {
          console.error("❌ Error playing sound:", err);
        });
      } else {
        console.log("⚠️ Audio not unlocked yet.");
      }
    };

    recognition.onresult = (event) => {
      const transcript =
        event.results[event.results.length - 1][0].transcript.toLowerCase();
      console.log(" Heard:", transcript);

      if (transcript.includes("go to learn")) {
        navigate("/learn");
        playSuccessSound();
      }
      if (transcript.includes("upload image")) {
        navigate("/upload");
        speak("Opening image upload");
      } else if (transcript.includes("go to test")) {
        navigate("/test");
        playSuccessSound();
      } else if (transcript.includes("go to home")) {
        navigate("/");
        playSuccessSound();
      }

      const classMatch = transcript.match(/class (\d|one|two|three|four|five)/);
      if (classMatch) {
        const classValue = classMatch[1];
        const wordsToNumbers = {
          one: "1",
          two: "2",
          three: "3",
          four: "4",
          five: "5",
        };
        const finalClass = wordsToNumbers[classValue] || classValue;
        window.dispatchEvent(
          new CustomEvent("voice-class", { detail: finalClass })
        );
        playSuccessSound();
      }

      const subjects = ["math", "science", "english"];
      subjects.forEach((subject) => {
        if (transcript.includes(subject)) {
          window.dispatchEvent(
            new CustomEvent("voice-subject", { detail: subject })
          );
          playSuccessSound();
        }
      });

      if (
        transcript.includes("upload") ||
        transcript.includes("upload image") ||
        transcript.includes("upload picture")
      ) {
        window.dispatchEvent(new Event("voice-upload"));
        playSuccessSound();
      }

      if (transcript.includes("play video")) {
        window.dispatchEvent(new Event("voice-play-video"));
        playSuccessSound();
      }
    };

    recognition.start();
    return () => recognition.stop();
  }, [navigate, audioUnlocked]);

  return <audio ref={audioRef} src={done} preload="auto" />;
};

export default VoiceCommand;
