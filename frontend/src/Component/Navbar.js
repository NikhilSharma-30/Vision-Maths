import React from 'react'
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function Navbar() {
   return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="sticky top-0 bg-gradient-to-r from-sky-600 to-blue-700 shadow-lg p-4 z-50 text-white"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold tracking-wide">VisionMath</h1>
        <div className="space-x-6 text-base sm:text-lg font-medium">
          <Link to="/" className="hover:text-yellow-300 transition">Home</Link>
          <Link to="/learn" className="hover:text-yellow-300 transition">Learn</Link>
          <Link to="/test" className="hover:text-yellow-300 transition">Test</Link>
        </div>
      </div>
    </motion.nav>
  );
}

export default Navbar
