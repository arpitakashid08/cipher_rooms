"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, Terminal } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [unlocked, setUnlocked] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [typedText, setTypedText] = useState("");
  const router = useRouter();

  const codeString = "Initializing CipherRooms...\nEstablishing Secure Connection...\nBypassing Firewalls...\nAccess Granted.";

  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      setTypedText(codeString.slice(0, i));
      i++;
      if (i > codeString.length) {
        clearInterval(typingInterval);
        setTimeout(() => setUnlocked(true), 1000);
      }
    }, 50);
    return () => clearInterval(typingInterval);
  }, []);

  useEffect(() => {
    if (unlocked) {
      setTimeout(() => setShowLogo(true), 1500);
      setTimeout(() => router.push("/dashboard"), 4000);
    }
  }, [unlocked, router]);

  // Generate random particles
  const particles = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100 + "vw",
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 5,
  }));

  return (
    <div className="relative w-full h-screen bg-cyber-bg cyber-grid flex flex-col items-center justify-center overflow-hidden">
      {/* Matrix Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-1 h-3 bg-cyber-blue rounded-full opacity-50"
          initial={{ top: "-10%", left: p.x }}
          animate={{ top: "110%" }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "linear" }}
          style={{ boxShadow: "0 0 8px #00f0ff" }}
        />
      ))}

      <AnimatePresence>
        {!showLogo ? (
          <motion.div
            key="lock-screen"
            exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }}
            transition={{ duration: 1 }}
            className="flex flex-col items-center z-10"
          >
            {/* Hacker Silhouette Silhouette placeholder via icon */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-cyber-blue mb-8 opacity-70"
            >
              <Terminal size={80} className="drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]" />
            </motion.div>

            <div className="h-24 w-80 font-mono text-cyber-blue text-sm mb-8 text-center bg-black/50 p-4 border border-cyber-blue/30 rounded-md shadow-[0_0_15px_rgba(0,240,255,0.1)]">
              {typedText}
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              >
                _
              </motion.span>
            </div>

            <motion.div
              animate={{ 
                rotateY: unlocked ? 180 : 0, 
                scale: unlocked ? 1.2 : 1 
              }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              {unlocked ? (
                <Unlock size={64} className="text-cyber-blue drop-shadow-[0_0_20px_rgba(0,240,255,1)]" />
              ) : (
                <Lock size={64} className="text-red-500 drop-shadow-[0_0_20px_rgba(255,0,0,1)]" />
              )}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="logo-screen"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="z-10 flex flex-col items-center"
          >
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyber-blue via-white to-cyber-purple drop-shadow-[0_0_30px_rgba(0,240,255,0.8)]">
              CIPHERROOMS
            </h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-cyber-blue mt-4 font-mono tracking-widest uppercase text-sm md:text-base neon-text"
            >
              Secure. Collaborate. Transcend.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
