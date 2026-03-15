"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import { Send, Users, Cpu, FileText, CheckSquare, MessageSquare, ArrowLeft, Bot, ExternalLink, Shield, Info, User as UserIcon, Lock } from "lucide-react";
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

  // Tabs
  const [activeTab, setActiveTab] = useState<"chat" | "intel">("chat");

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
    const newSocket = io("http://localhost:5005");
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
      const res = await axios.get(`http://localhost:5005/api/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoom(res.data);
    } catch (err) {
      console.error("Error fetching room", err);
    }
  };

  const fetchMessages = async (token: string) => {
    try {
      const res = await axios.get(`http://localhost:5005/api/messages/${roomId}`, {
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
      const res = await axios.post(`http://localhost:5005/api/ai/summarize/${roomId}`, {}, {
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
      const res = await axios.post(`http://localhost:5005/api/ai/tasks/${roomId}`, {}, {
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
      const res = await axios.post(`http://localhost:5005/api/ai/ask`, { question: aiQuery }, {
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

  // Determine if user is a leader in this room
  const isLeader = room.leaderIds?.some((l: any) => l._id === user.id);
  const isCreator = room.creatorId?._id === user.id;

  return (
    <div className="h-screen bg-cyber-bg cyber-grid text-white font-mono flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-20 border-b border-cyber-blue/30 flex items-center justify-between px-6 bg-cyber-dark/90 backdrop-blur z-10 shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-widest text-glow-blue uppercase flex items-center gap-3">
              {room.name} 
              <span className="text-[10px] bg-cyber-blue/20 text-cyber-blue px-2 py-0.5 rounded border border-cyber-blue/30 tracking-widest">#{room.code}</span>
              {(isLeader || isCreator) && (
                <span className="text-[10px] bg-cyber-purple/20 text-cyber-purple px-2 py-0.5 rounded border border-cyber-purple/30 tracking-widest flex items-center gap-1">
                  <Shield className="w-3 h-3" /> COMMAND
                </span>
              )}
            </h1>
            {room.description && (
              <p className="text-xs text-cyber-blue/60 mt-1 max-w-lg truncate flex items-center gap-1">
                <Info className="w-3 h-3" /> {room.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          {room.domainName && (
            <div className="flex items-center gap-2 text-xs uppercase text-cyber-blue/80 border border-cyber-blue/30 bg-cyber-blue/10 px-3 py-1.5 rounded">
              {room.domainName.toLowerCase().includes('tech') && <ExternalLink className="w-3 h-3"/>}
              {room.domainName}
            </div>
          )}
          <div className="flex items-center gap-2 text-cyber-purple text-sm bg-cyber-purple/10 border border-cyber-purple/30 px-3 py-1.5 rounded shadow-[inset_0_0_10px_rgba(139,0,255,0.1)]">
            <Users className="w-4 h-4" /> 
            {room.members?.length || 0} OPERATORS
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Team Roster */}
        <aside className="w-64 bg-black/40 border-r border-cyber-blue/20 hidden md:flex flex-col shrink-0">
          <div className="p-4 border-b border-cyber-blue/20 uppercase text-xs tracking-[0.2em] text-cyber-blue font-bold">
            Network Roster
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            
            {/* Leaders Section */}
            {room.leaderIds && room.leaderIds.length > 0 && (
              <div>
                <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Shield className="w-3 h-3 text-cyber-purple" /> Squad Leaders
                </h3>
                <div className="space-y-2">
                  {room.leaderIds.map((l: any) => (
                    <div key={'l-'+l._id} className="flex items-center gap-2 text-xs text-white bg-cyber-purple/10 border border-cyber-purple/30 p-2 rounded">
                      <div className="w-2 h-2 rounded-full bg-cyber-purple animate-pulse" />
                      <span className="truncate">{l.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members Section */}
            <div>
              <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <UserIcon className="w-3 h-3 text-cyber-blue" /> Tactical Members
              </h3>
              <div className="space-y-2">
                {room.members?.map((m: any) => {
                  // Skip if member is already listed as a leader
                  if (room.leaderIds?.some((l: any) => l._id === m._id)) return null;
                  
                  return (
                    <div key={'m-'+m._id} className="flex items-center gap-2 text-xs text-gray-300 bg-cyber-blue/5 border border-cyber-blue/10 p-2 rounded hover:bg-cyber-blue/10 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-cyber-blue/50" />
                      <span className="truncate">{m.name}</span>
                      {m._id === user.id && <span className="ml-auto text-[9px] text-cyber-blue/50">(YOU)</span>}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </aside>

        {/* Center: Chat Area */}
        <section className="flex-1 flex flex-col relative bg-black/60 shadow-[inset_0_0_50px_rgba(0,240,255,0.02)]">
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar" id="chat-container">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-cyber-blue/30 space-y-4">
                <MessageSquare className="w-16 h-16 drop-shadow-[0_0_15px_rgba(0,240,255,0.2)]" />
                <p className="uppercase tracking-[0.2em] text-sm">Comm Channel Opened</p>
                <p className="text-xs tracking-wider opacity-60">Awaiting encrypted transmissions...</p>
              </div>
            )}
            
            {messages.map((msg, i) => {
              const isOwn = msg.senderId?._id === user.id || msg.senderId === user.id;
              const senderIsLeader = room.leaderIds?.some((l: any) => l._id === (msg.senderId?._id || msg.senderId));
              
              return (
                <div key={i} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                  {!isOwn && (
                    <span className="text-[10px] text-cyber-blue/70 mb-1 ml-1 tracking-widest uppercase flex items-center gap-1">
                      {senderIsLeader && <Shield className="w-3 h-3 text-cyber-purple inline" />}
                      {msg.senderId?.name || "Unknown Operator"}
                    </span>
                  )}
                  <div 
                    className={`max-w-[80%] px-4 py-3 rounded-md relative group ${
                      isOwn 
                        ? "bg-cyber-blue/20 border border-cyber-blue/40 text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.1)] rounded-br-none" 
                        : "bg-[#0a0f1a] border border-gray-700 text-gray-200 rounded-bl-none shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                    <span className="text-[9px] opacity-40 absolute -bottom-5 right-0 hidden group-hover:block transition-opacity tracking-widest">
                      {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} className="h-4" />
          </div>

          <form onSubmit={sendMessage} className="h-24 border-t border-cyber-blue/30 bg-[#050511]/90 p-4 flex gap-3 items-center backdrop-blur z-20">
            <div className="relative flex-1 h-full">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Transmit Encrypted Message..."
                className="w-full h-full bg-[#0a0f1a] border border-cyber-blue/30 rounded px-6 text-sm text-white placeholder-cyber-blue/30 focus:outline-none focus:border-cyber-blue focus:shadow-[0_0_15px_rgba(0,240,255,0.15)] transition-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-[10px] text-cyber-blue/40 uppercase tracking-widest hidden sm:block">Secured</span>
                <Lock className="w-3 h-3 text-cyber-blue/40" />
              </div>
            </div>
            <button 
              type="submit" 
              className="h-full px-6 bg-[#00f0ff] text-[#050511] font-bold tracking-widest text-sm rounded uppercase flex items-center justify-center hover:bg-white hover:shadow-[0_0_20px_rgba(0,240,255,0.6)] disabled:opacity-50 disabled:hover:bg-[#00f0ff] disabled:hover:shadow-none transition-all"
              disabled={!newMessage.trim()}
            >
              SEND <Send className="w-4 h-4 ml-2" />
            </button>
          </form>

        </section>

        {/* Right Sidebar: CipherMind AI */}
        <aside className="w-80 bg-[#040811] hidden lg:flex flex-col border-l border-cyber-purple/30 z-10 shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-cyber-purple/50 to-transparent glow-purple opacity-50" />
          
          <div className="p-5 border-b border-cyber-purple/30 flex items-center gap-3 bg-[url('/noise.png')]">
            <Cpu className="text-cyber-purple w-6 h-6 drop-shadow-[0_0_8px_rgba(139,0,255,0.8)]" />
            <h2 className="text-sm uppercase text-glow-purple tracking-[0.2em] font-bold text-white">CipherMind Core</h2>
          </div>

          <div className="p-4 flex flex-col gap-3">
            <button 
              onClick={handleAISummarize} disabled={aiLoading}
              className="group flex items-center gap-3 w-full bg-[#0a0f1a] border border-cyber-purple/30 text-cyber-purple px-4 py-3 text-xs hover:bg-cyber-purple/10 hover:border-cyber-purple transition-all uppercase hover:shadow-[0_0_15px_rgba(139,0,255,0.2)] disabled:opacity-50"
            >
              <FileText className="w-4 h-4 group-hover:drop-shadow-[0_0_5px_rgba(139,0,255,0.8)]" /> 
              <span className="tracking-widest">Generate Summary</span>
            </button>
            <button 
              onClick={handleAITasks} disabled={aiLoading}
              className="group flex items-center gap-3 w-full bg-[#0a0f1a] border border-cyber-blue/30 text-cyber-blue px-4 py-3 text-xs hover:bg-cyber-blue/10 hover:border-cyber-blue transition-all uppercase hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] disabled:opacity-50"
            >
              <CheckSquare className="w-4 h-4 group-hover:drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]" /> 
              <span className="tracking-widest">Extract Tactics</span>
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto w-full relative custom-scrollbar">
            <AnimatePresence>
              {aiLoading && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#040811]/80 backdrop-blur-[2px] z-10 flex items-center justify-center m-4 border border-cyber-purple/20"
                >
                  <div className="text-cyber-purple text-xs animate-pulse flex flex-col items-center gap-3 text-center uppercase tracking-widest">
                    <Bot className="w-8 h-8 drop-shadow-[0_0_10px_rgba(139,0,255,0.8)]" />
                    Querying Neural Net...
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {aiResponse ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a0f1a] border border-cyber-purple/40 p-4 rounded-sm text-xs text-gray-300 font-mono whitespace-pre-wrap leading-loose shadow-[0_0_15px_rgba(139,0,255,0.05)]"
              >
                <div className="text-[#8b00ff] font-bold mb-2 pb-2 border-b border-[#8b00ff]/30 tracking-widest flex items-center gap-2">
                  <Bot className="w-4 h-4" /> AI INSIGHT
                </div>
                {aiResponse}
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-40 text-xs text-center border border-dashed border-cyber-purple/30 p-6">
                <Bot className="w-10 h-10 mb-4 text-cyber-purple" />
                <p className="tracking-widest leading-loose">SYSTEM IDLE.<br/>AWAITING QUERY INPUT.</p>
              </div>
            )}
          </div>

          <form onSubmit={handleAIAsk} className="p-5 border-t border-cyber-purple/30 bg-[#050511] relative z-20">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyber-purple to-transparent glow-purple opacity-50" />
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Query CipherMind..."
              className="w-full bg-[#0a0f1a] border border-cyber-purple/50 px-4 py-3 text-xs text-white placeholder-cyber-purple/30 focus:outline-none focus:border-cyber-purple focus:shadow-[0_0_10px_rgba(139,0,255,0.2)] transition-all mb-3"
            />
            <button 
              type="submit" 
              disabled={aiLoading || !aiQuery.trim()}
              className="w-full uppercase text-[10px] tracking-[0.2em] bg-cyber-purple text-white py-3 font-bold hover:bg-white hover:text-black hover:shadow-[0_0_15px_rgba(139,0,255,0.6)] transition-all disabled:opacity-50 disabled:hover:bg-cyber-purple disabled:hover:text-white"
            >
              EXECUTE QUERY
            </button>
          </form>

        </aside>
      </div>
    </div>
  );
}
