"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, PlusSquare, Network, Cpu, ShieldAlert, Key, Lock, Globe, X, User as UserIcon, Shield, Zap } from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const router = useRouter();

  // Create Room State
  const [showCreate, setShowCreate] = useState(false);
  
  // Advanced Create Room State
  const [accessLevel, setAccessLevel] = useState<"private" | "public">("private");
  const [roomDescription, setRoomDescription] = useState("");
  const [selectedLeaders, setSelectedLeaders] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [roomNameInput, setRoomNameInput] = useState("");

  // Join Room State
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    fetchRooms(token);
    fetchUsers(token, parsedUser.id);
  }, [router]);

  const fetchRooms = async (token: string) => {
    try {
      const res = await axios.get("http://localhost:5005/api/rooms", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async (token: string, currentUserId: string) => {
    try {
      const res = await axios.get("http://localhost:5005/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Exclude current user from assign lists
      setAllUsers(res.data.filter((u: any) => u._id !== currentUserId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const generatedName = roomNameInput.trim() || `Network-${Math.floor(Math.random()*1000)}`;
      
      await axios.post("http://localhost:5005/api/rooms", 
        { 
          name: generatedName, 
          isPublic: accessLevel === "public",
          description: roomDescription,
          leaderIds: selectedLeaders,
          memberIds: selectedMembers
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      closeCreateModal();
      fetchRooms(token!);
    } catch (err: any) {
      alert(err.response?.data?.error || "Error creating room");
    }
  };

  const closeCreateModal = () => {
    setShowCreate(false);
    setAccessLevel("private");
    setRoomDescription("");
    setSelectedLeaders([]);
    setSelectedMembers([]);
    setRoomNameInput("");
    setMemberSearch("");
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5005/api/rooms/join", 
        { code: joinCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowJoin(false);
      setJoinCode("");
      fetchRooms(token!);
    } catch (err: any) {
      alert(err.response?.data?.error || "Error joining room");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const toggleLeader = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedLeaders(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };

  const toggleMember = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  // Filter users based on search
  const filteredUsers = allUsers.filter(u => u.name.toLowerCase().includes(memberSearch.toLowerCase()));

  if (!user) return <div className="h-screen bg-cyber-bg flex items-center justify-center text-cyber-blue font-mono text-xl animate-pulse">AUTHENTICATING...</div>;

  return (
    <div className="min-h-screen bg-cyber-bg cyber-grid text-white font-mono flex flex-col items-center py-10 px-4">
      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center mb-12 border-b border-cyber-blue/30 pb-6 relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyber-blue to-transparent opacity-50 glow-blue shadow-[0_4px_10px_rgba(0,240,255,0.2)]" />
        
        <div className="flex items-center gap-4">
          <Cpu className="text-cyber-blue w-10 h-10 drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]" />
          <div>
            <h1 className="text-3xl font-bold tracking-widest text-glow-blue uppercase">Control Panel</h1>
            <p className="text-cyber-blue/70 text-sm tracking-wider mt-1 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> 
              OP: {user.name} // CLEARANCE: {user.role}
            </p>
          </div>
        </div>

        <button 
          onClick={logout}
          className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors uppercase text-sm border border-red-500/30 px-4 py-2 rounded hover:bg-red-500/10 hover:shadow-[0_0_10px_rgba(255,0,0,0.3)]"
        >
          <LogOut className="w-4 h-4" /> Disconnect
        </button>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-6xl flex flex-col gap-10">
        
        {/* Actions Menu */}
        <section className="flex flex-wrap gap-6 justify-center">
          {user.role === 'MainUser' && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <button 
                onClick={() => setShowCreate(true)}
                className="w-64 h-32 bg-cyber-dark/80 border border-cyber-blue border-l-4 border-l-cyber-blue rounded flex flex-col justify-center items-center gap-3 group hover:bg-cyber-blue/10 backdrop-blur"
              >
                <PlusSquare className="w-8 h-8 text-cyber-blue group-hover:drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
                <span className="uppercase tracking-widest text-sm text-cyber-blue group-hover:text-white transition-colors">Initiate Room</span>
              </button>
            </motion.div>
          )}

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <button 
              onClick={() => setShowJoin(true)}
              className="w-64 h-32 bg-cyber-dark/80 border border-cyber-purple border-l-4 border-l-cyber-purple rounded flex flex-col justify-center items-center gap-3 group hover:bg-cyber-purple/10 backdrop-blur"
            >
              <Key className="w-8 h-8 text-cyber-purple group-hover:drop-shadow-[0_0_8px_rgba(139,0,255,0.8)]" />
              <span className="uppercase tracking-widest text-sm text-cyber-purple group-hover:text-white transition-colors">Request Access</span>
            </button>
          </motion.div>
        </section>

        {/* Create Room Modal - Advanced UI */}
        <AnimatePresence>
          {showCreate && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="bg-[#040811] border border-[#00f0ff]/30 w-full max-w-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="flex justify-between items-center p-6 pb-2">
                  <h3 className="text-[#00f0ff] uppercase tracking-[0.2em] font-bold text-sm">Create New Room</h3>
                  <button onClick={closeCreateModal} className="text-gray-500 hover:text-[#00f0ff] transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Progress Bar Line */}
                <div className="px-6 pb-6 flex items-center gap-2">
                  <div className="h-1 bg-[#00f0ff] w-1/3 shadow-[0_0_8px_#00f0ff]" />
                  <div className="h-1 bg-[#00f0ff]/20 w-1/3" />
                  <div className="h-1 bg-[#00f0ff]/10 w-1/3" />
                </div>

                {/* Form Body - Scrollable */}
                <div className="px-6 overflow-y-auto custom-scrollbar space-y-8 flex-1">
                  
                  {/* Access Level */}
                  <div className="space-y-3">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest block">Access Level</label>
                    <div className="space-y-3">
                      <button 
                        type="button"
                        onClick={() => setAccessLevel("private")}
                        className={`w-full flex items-center gap-4 p-4 text-left transition-all border ${accessLevel === 'private' ? 'bg-[#00f0ff]/10 border-[#00f0ff] shadow-[inset_0_0_15px_rgba(0,240,255,0.1)]' : 'bg-[#0a0f1a] border-[#00f0ff]/20 hover:border-[#00f0ff]/50'}`}
                      >
                        <Lock className={`w-6 h-6 ${accessLevel === 'private' ? 'text-[#00f0ff]' : 'text-gray-500'}`} />
                        <div>
                          <div className={`font-bold tracking-wider uppercase text-sm ${accessLevel === 'private' ? 'text-[#00f0ff]' : 'text-gray-400'}`}>Private</div>
                          <div className="text-xs text-gray-500">Invite only • Admin approval</div>
                        </div>
                      </button>

                      <button 
                        type="button"
                        onClick={() => setAccessLevel("public")}
                        className={`w-full flex items-center gap-4 p-4 text-left transition-all border ${accessLevel === 'public' ? 'bg-[#00f0ff]/10 border-[#00f0ff] shadow-[inset_0_0_15px_rgba(0,240,255,0.1)]' : 'bg-[#0a0f1a] border-[#00f0ff]/20 hover:border-[#00f0ff]/50'}`}
                      >
                        <Globe className={`w-6 h-6 ${accessLevel === 'public' ? 'text-[#00f0ff]' : 'text-gray-500'}`} />
                        <div>
                          <div className={`font-bold tracking-wider uppercase text-sm ${accessLevel === 'public' ? 'text-[#00f0ff]' : 'text-gray-400'}`}>Public</div>
                          <div className="text-xs text-gray-500">Discoverable • Still requires approval</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Optional Room Name - not in strict screenshot but needed for UX */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest block">Room Identity (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Protocol Alpha"
                      value={roomNameInput}
                      onChange={(e) => setRoomNameInput(e.target.value)}
                      className="w-full bg-[#0a0f1a] border border-[#00f0ff]/20 p-4 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#00f0ff]/50 transition-colors"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest block">Description</label>
                    <textarea 
                      placeholder="What is this room for?"
                      value={roomDescription}
                      onChange={(e) => setRoomDescription(e.target.value)}
                      className="w-full bg-[#0a0f1a] border border-[#00f0ff]/20 p-4 min-h-[100px] text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#00f0ff]/50 transition-colors resize-none"
                    />
                  </div>

                  {/* Assign Leaders */}
                  <div className="space-y-3">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest block">Assign Leaders (Optional)</label>
                    <div className="grid grid-cols-2 gap-3">
                      {allUsers.map((u) => {
                        const isSelected = selectedLeaders.includes(u._id);
                        return (
                          <button
                            key={'leader-'+u._id}
                            onClick={(e) => toggleLeader(u._id, e)}
                            className={`flex items-center justify-center gap-2 p-3 border text-xs tracking-wider transition-all ${isSelected ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff]' : 'bg-[#0a0f1a] border-[#00f0ff]/20 text-gray-500 hover:border-[#00f0ff]/50 hover:text-gray-300'}`}
                          >
                            <Shield className={`w-3 h-3 ${isSelected ? 'text-[#00f0ff]' : 'opacity-0'}`} />
                            {u.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Assign Members */}
                  <div className="space-y-3 pb-6">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest block">Assign Members (Optional)</label>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {filteredUsers.map((u) => {
                        const isSelected = selectedMembers.includes(u._id);
                        return (
                          <button
                            key={'member-'+u._id}
                            onClick={(e) => toggleMember(u._id, e)}
                            className={`flex items-center justify-center gap-2 p-3 border text-xs tracking-wider transition-all ${isSelected ? 'bg-[#00f0ff]/10 border-[#00f0ff]/50 text-white' : 'bg-[#0a0f1a] border-[#00f0ff]/20 text-gray-500 hover:border-[#00f0ff]/50 hover:text-gray-300'}`}
                          >
                            <UserIcon className={`w-3 h-3 ${isSelected ? 'text-[#00f0ff]' : 'opacity-50'}`} />
                            {u.name}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex border border-[#00f0ff]/20 bg-[#0a0f1a] focus-within:border-[#00f0ff]/50 transition-colors">
                      <input 
                        type="text" 
                        placeholder="Add new member name"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className="flex-1 bg-transparent px-4 py-3 text-xs text-gray-300 placeholder-gray-600 focus:outline-none"
                      />
                      <button 
                        type="button"
                        className="px-6 border-l border-[#00f0ff]/20 text-[#00f0ff] text-xs font-bold tracking-widest hover:bg-[#00f0ff]/10 transition-colors uppercase"
                      >
                        ADD
                      </button>
                    </div>
                  </div>

                </div>

                {/* Footer Buttons */}
                <div className="p-6 pt-4 border-t border-[#00f0ff]/20 flex gap-4 bg-[#040811]">
                  <button 
                    onClick={closeCreateModal}
                    className="flex-1 py-4 border border-[#00f0ff]/30 text-xs tracking-[0.2em] font-bold text-gray-400 hover:text-white hover:border-white transition-all uppercase flex justify-center items-center gap-2"
                  >
                    <span className="text-[#00f0ff]">&larr;</span> BACK
                  </button>
                  <button 
                    onClick={handleCreateRoom}
                    className="flex-[2] py-4 bg-[#002025] hover:bg-[#00f0ff]/20 border border-[#00f0ff]/50 text-xs tracking-[0.2em] font-bold text-[#00f0ff] transition-all uppercase flex justify-center items-center gap-2 shadow-[inset_0_0_20px_rgba(0,240,255,0.1)]"
                  >
                    CREATE ROOM <span className="text-[#00f0ff]">&rarr;</span>
                  </button>
                </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Join Modal - Keeps existing style */}
        {showJoin && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-cyber-dark border border-cyber-purple/50 p-8 rounded-lg max-w-md w-full relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-cyber-purple glow-purple" />
              <h3 className="text-xl uppercase text-cyber-purple mb-6 drop-shadow-[0_0_5px_rgba(139,0,255,0.8)]">Enter Room Cipher</h3>
              <form onSubmit={handleJoinRoom} className="space-y-4">
                <input 
                  type="text" required placeholder="6-Char Room Code" maxLength={6}
                  value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full bg-black/50 border border-cyber-purple/30 rounded px-4 py-2 outline-none focus:border-cyber-purple text-center uppercase tracking-[0.5em] text-lg font-bold"
                />
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 bg-cyber-purple/20 text-cyber-purple border border-cyber-purple py-2 uppercase hover:bg-cyber-purple hover:text-black transition-colors">Connect</button>
                  <button type="button" onClick={() => setShowJoin(false)} className="flex-1 bg-transparent text-gray-500 border border-gray-700 py-2 uppercase hover:text-white hover:border-white transition-colors">Abort</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rooms Grid */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Network className="text-cyber-blue w-6 h-6" />
            <h2 className="text-xl uppercase tracking-widest">Active Networks</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-600 border border-dashed border-gray-800 rounded bg-black/20">
                <p className="uppercase tracking-widest text-sm">No networks available or assigned.</p>
              </div>
            ) : (
              rooms.map((room) => (
                <div 
                  key={room._id} 
                  onClick={() => router.push(`/room/${room._id}`)}
                  className="bg-black/40 border border-cyber-blue/20 rounded-lg p-5 cursor-pointer hover:border-cyber-blue/80 hover:bg-cyber-blue/5 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] transition-all relative overflow-hidden group flex flex-col"
                >
                  <div className="absolute right-0 top-0 w-16 h-16 bg-gradient-to-bl from-cyber-blue/20 to-transparent -rotate-45 translate-x-8 -translate-y-8 group-hover:from-cyber-blue/40 transition-all" />
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                      <h3 className="text-lg text-white font-bold tracking-wider">{room.name}</h3>
                      {room.domainName && <span className="text-xs bg-cyber-blue/20 text-cyber-blue px-2 py-0.5 rounded border border-cyber-blue/30 mt-1 inline-block">{room.domainName}</span>}
                    </div>
                    <span className="text-xs font-mono text-gray-500 tracking-widest">#{room.code}</span>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-800 text-xs text-gray-400 flex justify-between uppercase">
                    <span>POPULATION: {room.members?.length || 0}</span>
                    <span className={room.isPublic ? "text-green-400" : "text-cyber-purple"}>{room.isPublic ? 'PUBLIC' : 'SECURE'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
