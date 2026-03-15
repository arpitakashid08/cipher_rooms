"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Mail, Key, User, ShieldCheck } from "lucide-react";
import axios from "axios";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Member");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5005/api/auth/register", { name, email, password, role });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration Failed");
    }
  };

  return (
    <div className="min-h-screen bg-cyber-bg cyber-grid flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-cyber-dark/80 border opacity-95 border-cyber-purple/30 rounded-lg p-8 shadow-[0_0_20px_rgba(139,0,255,0.15)] relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-purple to-transparent glow-purple" />
        
        <div className="flex flex-col items-center mb-8">
          <div className="bg-black/50 p-4 rounded-full border border-cyber-purple/50 mb-4 shadow-[0_0_15px_rgba(139,0,255,0.2)]">
            <Shield className="text-cyber-purple w-8 h-8 drop-shadow-[0_0_8px_rgba(139,0,255,0.8)]" />
          </div>
          <h2 className="text-3xl font-mono text-white tracking-widest drop-shadow-[0_0_5px_rgba(139,0,255,0.8)] uppercase">Clearance</h2>
          <p className="text-cyber-purple/70 text-sm mt-2 font-mono uppercase tracking-wider">Initialize New Operator</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 font-mono text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-purple/50 w-5 h-5" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Operator Alias"
              required
              className="w-full bg-black/50 border border-cyber-purple/30 rounded px-10 py-3 text-white placeholder-cyber-purple/30 focus:outline-none focus:border-cyber-purple focus:shadow-[0_0_10px_rgba(139,0,255,0.3)] transition-all font-mono"
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-purple/50 w-5 h-5" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@system.io"
              required
              className="w-full bg-black/50 border border-cyber-purple/30 rounded px-10 py-3 text-white placeholder-cyber-purple/30 focus:outline-none focus:border-cyber-purple focus:shadow-[0_0_10px_rgba(139,0,255,0.3)] transition-all font-mono"
            />
          </div>

          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-purple/50 w-5 h-5" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-black/50 border border-cyber-purple/30 rounded px-10 py-3 text-white placeholder-cyber-purple/30 focus:outline-none focus:border-cyber-purple focus:shadow-[0_0_10px_rgba(139,0,255,0.3)] transition-all font-mono"
            />
          </div>

          <div className="relative">
            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-purple/50 w-5 h-5" />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-black/50 border border-cyber-purple/30 rounded px-10 py-3 text-white placeholder-cyber-purple/30 focus:outline-none focus:border-cyber-purple focus:shadow-[0_0_10px_rgba(139,0,255,0.3)] transition-all font-mono appearance-none"
            >
              <option value="Member">Tactical Member</option>
              <option value="Leader">Squad Leader</option>
              <option value="MainUser">System Admin (Main User)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-cyber-purple/10 hover:bg-cyber-purple/20 border border-cyber-purple text-cyber-purple font-mono font-bold py-3 px-4 rounded transition-all uppercase tracking-widest hover:shadow-[0_0_15px_rgba(139,0,255,0.4)] mt-2"
          >
            Establish Record
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-mono text-gray-500">
          Existing clearance?{" "}
          <a href="/login" className="text-cyber-purple hover:text-white transition-colors underline decoration-cyber-purple/50 underline-offset-4">
            Authenticate
          </a>
        </p>
      </div>
    </div>
  );
}
