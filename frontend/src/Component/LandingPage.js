import { motion } from 'framer-motion';
import main from "./img/main.png"

const LandingPage = () => {
  return (
    <motion.div
      className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-blue-100 px-4 py-12 text-center overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
     
      <motion.img
        src={main}
        alt="VisionMath Background"
        className="absolute inset-0 w-full h-full object-contain opacity-25 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.20 }}
        transition={{ duration: 1.5 }}
      />

     
      <motion.h2
        className="relative z-10 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-blue-800 max-w-4xl leading-tight"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
      >
        Welcome to <span className="text-sky-600">VisionMath</span> – Empowering Education for Every Learner
      </motion.h2>
    </motion.div>
  );
};

export default LandingPage;
