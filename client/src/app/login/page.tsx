"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Key } from "lucide-react";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login Failed");
    }
  };

  return (
    <div className="min-h-screen bg-cyber-bg cyber-grid flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-cyber-dark/80 border opacity-95 border-cyber-blue/30 rounded-lg p-8 shadow-[0_0_20px_rgba(0,240,255,0.15)] relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-blue to-transparent glow-blue" />
        
        <div className="flex flex-col items-center mb-8">
          <div className="bg-black/50 p-4 rounded-full border border-cyber-blue/50 mb-4 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <Lock className="text-cyber-blue w-8 h-8 drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
          </div>
          <h2 className="text-3xl font-mono text-white tracking-widest text-glow-blue uppercase">Access</h2>
          <p className="text-cyber-blue/70 text-sm mt-2 font-mono uppercase tracking-wider">System Authentication Required</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 font-mono text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-blue/50 w-5 h-5" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@system.io"
              required
              className="w-full bg-black/50 border border-cyber-blue/30 rounded px-10 py-3 text-white placeholder-cyber-blue/30 focus:outline-none focus:border-cyber-blue focus:shadow-[0_0_10px_rgba(0,240,255,0.3)] transition-all font-mono"
            />
          </div>

          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-blue/50 w-5 h-5" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-black/50 border border-cyber-blue/30 rounded px-10 py-3 text-white placeholder-cyber-blue/30 focus:outline-none focus:border-cyber-blue focus:shadow-[0_0_10px_rgba(0,240,255,0.3)] transition-all font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-cyber-blue/10 hover:bg-cyber-blue/20 border border-cyber-blue text-cyber-blue font-mono font-bold py-3 px-4 rounded transition-all uppercase tracking-widest hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]"
          >
            Authenticate
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-mono text-gray-500">
          Unregistered operator?{" "}
          <a href="/register" className="text-cyber-blue hover:text-white transition-colors underline decoration-cyber-blue/50 underline-offset-4">
            Request Clearance
          </a>
        </p>
      </div>
    </div>
  );
}
