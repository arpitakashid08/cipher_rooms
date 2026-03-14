"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import { Send, Users, Cpu, FileText, CheckSquare, MessageSquare, ArrowLeft, Bot, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Room() {
  const params = useParams();
  const roomId = params.id as string;
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);

  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiQuery, setAiQuery] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      router.push("/login");
      return;
    }
    const usr = JSON.parse(storedUser);
    setUser(usr);

    fetchRoomData(token);
    fetchMessages(token);

    // Setup Socket
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("join_room", roomId);
    });

    newSocket.on("receive_message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchRoomData = async (token: string) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoom(res.data);
    } catch (err) {
      console.error("Error fetching room", err);
    }
  };

  const fetchMessages = async (token: string) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/messages/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    } catch (err) {
      console.error("Error fetching messages", err);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !user) return;

    socket.emit("send_message", {
      roomId,
      senderId: user.id,
      senderName: user.name,
      text: newMessage,
    });

    setNewMessage("");
  };

  // --- AI FEATURES ---
  const handleAISummarize = async () => {
    if (messages.length === 0) return alert("System requires more data to summarize.");
    setAiLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`http://localhost:5000/api/ai/summarize/${roomId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAiResponse(`[SUMMARY]:\n${res.data.summary}`);
    } catch (err) {
      setAiResponse(">> Error connecting to CipherMind Core.");
    }
    setAiLoading(false);
  };

  const handleAITasks = async () => {
    if (messages.length === 0) return alert("No operations detected yet.");
    setAiLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`http://localhost:5000/api/ai/tasks/${roomId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAiResponse(`[ACTION ITEMS]:\n${res.data.tasks}`);
    } catch (err) {
      setAiResponse(">> Error extracting operational tasks.");
    }
    setAiLoading(false);
  };

  const handleAIAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`http://localhost:5000/api/ai/ask`, { question: aiQuery }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAiResponse(`[QUERY: ${aiQuery}]\n\nRESPONSE:\n${res.data.answer}`);
      setAiQuery("");
    } catch (err) {
      setAiResponse(">> Error querying CipherMind Database.");
    }
    setAiLoading(false);
  };

  if (!user || !room) {
    return <div className="h-screen bg-cyber-bg flex items-center justify-center text-cyber-blue font-mono text-xl animate-pulse">ESTABLISHING UPLINK...</div>;
  }

  return (
    <div className="h-screen bg-cyber-bg cyber-grid text-white font-mono flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-16 border-b border-cyber-blue/30 flex items-center justify-between px-6 bg-cyber-dark/80 backdrop-blur z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-widest text-glow-blue uppercase flex items-center gap-2">
              {room.name} 
              <span className="text-xs bg-cyber-blue/20 text-cyber-blue px-2 py-0.5 rounded border border-cyber-blue/30 ml-2">#{room.code}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {room.domainName && room.domainName.toLowerCase().includes('tech') && (
            <a href="#" className="flex items-center gap-2 text-xs uppercase text-gray-400 hover:text-white border border-gray-700 hover:border-white px-3 py-1.5 rounded transition-all">
              <ExternalLink className="w-3 h-3"/> GitHub Repo
            </a>
          )}
          <div className="flex items-center gap-2 text-cyber-purple text-sm hidden md:flex">
            <Users className="w-4 h-4" /> 
            {room.members.length} Operators Connected
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Chat Area */}
        <section className="flex-1 flex flex-col border-r border-cyber-blue/20 relative">
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6" id="chat-container">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-cyber-blue/50 opacity-50 space-y-4">
                <MessageSquare className="w-16 h-16" />
                <p className="uppercase tracking-widest">Comm Channel Opened. Awaiting Transmissions.</p>
              </div>
            )}
            
            {messages.map((msg, i) => {
              const isOwn = msg.senderId?._id === user.id || msg.senderId === user.id;
              
              return (
                <div key={i} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                  {!isOwn && (
                    <span className="text-xs text-cyber-blue/70 mb-1 ml-1 tracking-wider uppercase">
                      {msg.senderId?.name || "Unknown Operator"}
                    </span>
                  )}
                  <div 
                    className={`max-w-[70%] px-4 py-3 rounded-md relative group ${
                      isOwn 
                        ? "bg-cyber-blue/20 border border-cyber-blue/40 text-cyber-blue shadow-[0_0_10px_rgba(0,240,255,0.1)] rounded-br-none" 
                        : "bg-cyber-dark border border-gray-700 text-gray-200 rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <span className="text-[10px] opacity-50 absolute bottom-1 right-2 hidden group-hover:block transition-opacity">
                      {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={sendMessage} className="h-20 border-t border-cyber-blue/30 bg-black/40 p-4 flex gap-3 items-center backdrop-blur">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Transmit Message..."
              className="flex-1 bg-cyber-dark/80 border border-cyber-blue/30 rounded px-4 py-3 text-white placeholder-cyber-blue/30 focus:outline-none focus:border-cyber-blue focus:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all"
            />
            <button 
              type="submit" 
              className="bg-cyber-blue text-black p-3 flex rounded items-center justify-center hover:bg-white hover:text-black transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.8)]"
              disabled={!newMessage.trim()}
            >
              <Send className="w-5 h-5 ml-1" />
            </button>
          </form>

        </section>

        {/* AI Sidebar - CipherMind */}
        <aside className="w-80 bg-cyber-dark/90 hidden lg:flex flex-col border-l border-cyber-purple/30 z-10 shrink-0 shadow-[-10px_0_20px_rgba(0,0,0,0.5)]">
          <div className="p-4 border-b border-cyber-purple/30 flex items-center gap-3">
            <Cpu className="text-cyber-purple w-6 h-6 drop-shadow-[0_0_8px_rgba(139,0,255,0.8)]" />
            <h2 className="text-lg uppercase text-glow-purple tracking-widest text-white">CipherMind AI</h2>
          </div>

          <div className="p-4 flex flex-col gap-3">
            <button 
              onClick={handleAISummarize} disabled={aiLoading}
              className="flex items-center gap-3 w-full bg-cyber-purple/10 border border-cyber-purple/50 text-cyber-purple px-4 py-3 rounded text-sm hover:bg-cyber-purple/20 transition-all uppercase hover:shadow-[0_0_10px_rgba(139,0,255,0.3)] disabled:opacity-50"
            >
              <FileText className="w-4 h-4"/> Extract Intel (Summary)
            </button>
            <button 
              onClick={handleAITasks} disabled={aiLoading}
              className="flex items-center gap-3 w-full bg-cyber-blue/10 border border-cyber-blue/50 text-cyber-blue px-4 py-3 rounded text-sm hover:bg-cyber-blue/20 transition-all uppercase hover:shadow-[0_0_10px_rgba(0,240,255,0.3)] disabled:opacity-50"
            >
              <CheckSquare className="w-4 h-4"/> Identify Objectives (Tasks)
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto w-full relative">
            <AnimatePresence>
              {aiLoading && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-10 flex items-center justify-center border border-cyber-purple/30 m-4 rounded"
                >
                  <div className="text-cyber-purple text-xs animate-pulse flex flex-col items-center gap-2 text-center">
                    <Bot className="w-8 h-8"/>
                    Processing Neutral Network...
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {aiResponse ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-black/80 border border-cyber-purple/40 p-3 rounded text-xs text-cyber-purple/90 whitespace-pre-wrap leading-relaxed shadow-[0_0_10px_rgba(139,0,255,0.1)]"
              >
                {aiResponse}
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-xs text-center border border-dashed border-gray-700 rounded p-4">
                <Bot className="w-8 h-8 mb-2" />
                <p>AI Core Standing By.<br/>Await command or ask a query.</p>
              </div>
            )}
          </div>

          <form onSubmit={handleAIAsk} className="p-4 border-t border-cyber-purple/30 bg-black/60 relative">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyber-purple to-transparent glow-purple" />
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Query CipherMind..."
              className="w-full bg-black border border-cyber-purple/50 rounded px-3 py-2 text-xs text-white placeholder-cyber-purple/50 focus:outline-none focus:border-cyber-purple transition-colors mb-2"
            />
            <button 
              type="submit" 
              disabled={aiLoading || !aiQuery.trim()}
              className="w-full uppercase text-[10px] tracking-widest bg-cyber-purple text-black py-1.5 rounded font-bold hover:bg-white transition-colors"
            >
              Execute Query
            </button>
          </form>

        </aside>
      </div>
    </div>
  );
}
