# WebRTC Monitoring App

This project contains a Node.js/Express + Socket.IO backend and a Vite + React frontend implementing a simple admin/caretaker/parent flow with WebRTC one-way streaming and chat.

- Backend path: `server/`
- Frontend path: `client/`

## Prerequisites
- Node.js 18+
- MongoDB running locally (or a reachable URI)

## Configure environment
Copy `server/.env.example` to `server/.env` and set variables:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/webrtc_app
JWT_SECRET=replace_with_a_long_random_secret
```

## Install dependencies
Open two terminals:

Terminal A (server):
```
npm install
npm run dev
```
Run these in the `server/` directory.

Terminal B (client):
```
npm install
npm run dev
```
Run these in the `client/` directory. Vite will print a local URL (e.g., http://localhost:5173).

## Accounts and roles
You can self-register during development from `/login` by toggling to Register:
- Roles: `admin`, `caretaker`, `parent`
- Admin can create users and assign a parent to a caretaker.
- Parent can request to watch their assigned caretaker.
- Caretaker can acquire camera/microphone and start broadcast.

## WebRTC flow (high level)
- Caretaker clicks "Get Camera & Mic" then "Start Broadcast".
- Parent clicks "Watch Assigned Caretaker".
- Signaling exchanges offers/answers and ICE candidates via Socket.IO.

If you have trouble connecting remotely across NAT, you may need STUN/TURN servers. Currently, the example uses default `RTCPeerConnection()` without ICE servers for simplicity.

## Common issues
- If you see `Socket connect error Missing token`, login first so the token is in localStorage.
- If chat messages do not appear, ensure the caretaker has started a broadcast (which joins the chat room) and the parent has clicked watch (which also joins the chat room).
- If the server won’t start, verify MongoDB is running and `MONGO_URI` is correct.

## Scripts
- Server: `npm run dev` (nodemon), `npm start` (node)
- Client: `npm run dev`, `npm run build`, `npm run preview`

## Notes
- Express CORS is permissive for development. Restrict origins in production.
- Mongoose options `useNewUrlParser` and `useUnifiedTopology` are no-ops in Mongoose 8 but harmless.
