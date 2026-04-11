import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import done from "./sound/done.mp3"; 
const RouteChangeSound = () => {
  const location = useLocation();
  const audioRef = useRef(null);

  useEffect(() => {
    const playBeep = () => {
      if (audioRef.current) {
        const sound = audioRef.current;
        sound.currentTime = 0; 
        sound.play().catch((err) => {
          console.warn("Beep failed to play automatically:", err);
        });
      }
    };

    playBeep();
  }, [location.pathname]);

  return <audio ref={audioRef} src={done} preload="auto" />;
};

export default RouteChangeSound;
