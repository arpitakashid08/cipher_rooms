# CipherRooms

CipherRooms is a production-ready, secure collaboration and communication platform designed for teams and professional groups, featuring real-time WebSockets, robust authentication, and OpenAI integration (CipherMind).

## Tech Stack
- **Frontend**: Next.js (App Router), React, Tailwind CSS, Framer Motion, Socket.io-client
- **Backend**: Node.js, Express, Socket.io, JWT, bcrypt, OpenAI API
- **Database**: MongoDB (via Mongoose)

## Setup Instructions

### Prerequisites
Make sure you have Node.js (v18+) and MongoDB installed and running.

1. **Clone/Navigate to Project**
   `cd CipherRooms`

2. **Setup Server**
   ```bash
   cd server
   npm install
   ```
   *Environment Variables (server/.env)*:
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5005
   MONGODB_URI=mongodb://127.0.0.1:27017/cipherrooms
   JWT_SECRET=your_super_secret_jwt_key
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Setup Client**
   ```bash
   cd ../client
   npm install
   ```

## Running the Application Locally

1. **Start Backend**
   ```bash
   cd server
   npm run dev
   ```
   > The backend will start on `http://localhost:5005`

2. **Start Frontend**
   ```bash
   cd client
   npm run dev
   ```
   > The frontend will start on `http://localhost:3000`

## Deployment Instructions

### Backend (Render, Heroku, or AWS)
1. Set the Node version to `18.x`.
2. Push your `server` directory to your hosting provider.
3. Configure the `MONGODB_URI`, `JWT_SECRET`, and `OPENAI_API_KEY` Environment Variables on your host.
4. Set the start script to `npm start` (Compile TS to JS beforehand, or run `ts-node src/index.ts`).

### Frontend (Vercel)
1. Import the project using Vercel.
2. Select the `client` directory as the Root Directory.
3. Vercel will automatically detect Next.js and run the build command `npm run build`.
4. Ensure the client code points correctly to the deployed backend URL instead of `http://localhost:5005`.

## Architecture Details
- **Role Hierarchy**: MainUser > Leader > Member
- **Rooms**: Public/Private rooms.
- **CipherMind AI**: Chat summarizer, task extraction, smart assistant capabilities.
