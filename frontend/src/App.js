import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Component/Navbar";
import LandingPage from "./Component/LandingPage";
import LearnPage from "./Component/LearnPage";
import TestPage from "./Component/TestPage";
import "./App.css";
import VoiceCommand from "./Component/VoiceCommand";
import RouteChangeSound from "./Component/RouteChangeSound";
import VideoPlayerWithOCR from "./Component/VideoPlayerWithOCR ";
import ImageOCRUploader from './Component/ImageOCRUploader';

function App() {
  return (
    <Router>
      <VoiceCommand />
      <RouteChangeSound />
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/video-player"
          element={
            <VideoPlayerWithOCR/>
          }
        />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="/temp" element={<div style={{ display: "none" }}></div>} />
        <Route path="/upload" element={<ImageOCRUploader />} />
      </Routes>
    </Router>
  );
}

export default App;
