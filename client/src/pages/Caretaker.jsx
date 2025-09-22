import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getToken, getUser, logout } from '../utils/auth';
import Chat from '../components/Chat';

const SERVER = 'http://localhost:5000';

export default function Caretaker(){
  const localVideoRef = useRef();
  const [socket, setSocket] = useState(null);
  const localStreamRef = useRef(null);
  const pcsRef = useRef({}); // viewerSocketId -> RTCPeerConnection
  const user = getUser();

  useEffect(() => {
    const s = io(SERVER, { auth: { token: getToken() } });
    setSocket(s);

    s.on('connect_error', (err) => {
      console.error('Socket connect error', err.message);
    });

    // viewer wants to watch - create a new PeerConnection for them, add local tracks, create offer
    s.on('viewer-join', async ({ viewerId, viewerUser }) => {
      try {
        console.log('viewer-join', viewerId, viewerUser);
        if (!localStreamRef.current) {
          console.warn('No local stream yet');
          return;
        }

        const pc = new RTCPeerConnection();
        pcsRef.current[viewerId] = pc;

        // add local tracks
        localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));

        // ice candidates -> forward to viewer
        pc.onicecandidate = (ev) => {
          if (ev.candidate) {
            socket.emit('ice-candidate', { target: viewerId, candidate: ev.candidate });
          }
        };

        // create offer and send to viewer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { target: viewerId, sdp: offer });
        console.log('Sent offer to viewer', viewerId);
      } catch (err) {
        console.error(err);
      }
    });

    // parent answered -> set remote description
    s.on('answer', async ({ sdp, from }) => {
      const pc = pcsRef.current[from];
      if (!pc) { console.warn('No PC for answer from', from); return; }
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    // remote ICE candidate from viewer
    s.on('ice-candidate', async ({ candidate, from }) => {
      const pc = pcsRef.current[from];
      if (pc && candidate) {
        try { await pc.addIceCandidate(candidate); } catch (e) { console.warn(e); }
      }
    });

    return () => {
      s.disconnect();
    };
  }, []);

  // get local media
  async function startLocal() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = s;
      if (localVideoRef.current) localVideoRef.current.srcObject = s;
    } catch (err) {
      alert('Could not get camera/mic: ' + err.message);
    }
  }

  async function startBroadcast(){
    if(!socket) return;
    socket.emit('start-broadcast');
    alert('Broadcast started (socket notified). Parents can request to watch.');
  }

  return (
    <div style={{ padding: 10 }}>
      <h2>Caretaker dashboard — {user.username}</h2>
      <div>
        <video ref={localVideoRef} autoPlay playsInline muted style={{ width: 480, height: 360, background: '#000' }} />
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={startLocal}>Get Camera & Mic</button>
        <button onClick={startBroadcast} style={{ marginLeft: 8 }}>Start Broadcast</button>
        <button onClick={() => { logout(); window.location.reload(); }} style={{ marginLeft: 8 }}>Logout</button>
      </div>

      <div style={{ marginTop: 18 }}>
        <h3>Chat</h3>
        <p>Chat broadcasts to parents currently watching this caretaker (child name & id will be shown with messages).</p>
        <Chat socket={socket} caretakerId={user.id} myChild={null} />
      </div>
    </div>
  );
}
