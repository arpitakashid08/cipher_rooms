# 🔐 CipherRooms

CipherRooms is a **secure hierarchical collaboration platform** built for teams, hackathons, organizations, and project groups. It enables structured communication in encrypted rooms with role-based access, personalized sub‑rooms, and productivity tooling for modern teams.

---

## ✨ Features

- **Secure authentication** with hashed passwords and JWT sessions  
- **Real-time messaging** with role-tagged chat  
- **Role-based hierarchy** (Admin → Leader → Member)  
- **Personalized team rooms** under a main room  
- **File sharing** in chat  
- **Voice & video chat** actions (browser media)  
- **GitHub integration** button for tech teams  
- **AI assistant features** (summarization, task extraction, insights)  
- **Cybersecurity-themed animated landing page**

---

## 🧰 Tech Stack

**Frontend**  
React + Vite

**Backend**  
Node.js + Express

**Database**  
SQLite (file-based, persisted on disk)

**Authentication**  
JWT + bcryptjs

**Real-time Communication**  
Socket-style real-time UX (UI updates in app)

**AI**  
OpenAI API (optional, when enabled)

---

## 🧩 System Architecture Overview

CipherRooms uses a **single-server full‑stack architecture**:

- The **frontend** (React/Vite) provides UI for login, room creation/joining, chat, and dashboards.  
- The **backend** (Express) exposes secure API endpoints for auth, rooms, members, and chat.  
- **SQLite** stores users, rooms, and messages.  
- Role‑based access ensures only authorized users see/administer rooms.  

---
Application will run at:
http://localhost:5174

## ⚙️ Installation & Setup

```bash
# 1) Clone

git clone https://github.com/arpitakashid08/cipher_rooms.git
cd cipher_rooms/cipher-app

# 2) Install frontend deps

npm install

# 3) Build frontend

npm run build

# 4) Setup server env

cd server
cp .env.example .env

# Edit .env and set JWT_SECRET (and OPENAI_API_KEY if needed)

# 5) Install server deps

npm install

# 6) Run server (serves frontend + backend)

npm run start

