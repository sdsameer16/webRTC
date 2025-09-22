import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getToken, getUser, logout } from '../utils/auth';
import Chat from '../components/Chat';

const SERVER = 'http://localhost:5000';

export default function Parent(){
  const [socket, setSocket] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const remoteVideoRef = useRef();
  const pcRef = useRef(null);
  const user = getUser();

  useEffect(() => {
    const s = io(SERVER, { auth: { token: getToken() }});
    setSocket(s);

    s.on('connect_error', (err) => console.error('Socket err', err.message));

    // receive offer from caretaker
    s.on('offer', async ({ sdp, from }) => {
      try {
        console.log('Received offer', from);
        // create RTCPeerConnection
        const pc = new RTCPeerConnection();
        pcRef.current = pc;

        pc.ontrack = (e) => {
          console.log('ontrack', e);
          setRemoteStream(e.streams[0]);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
        };

        pc.onicecandidate = (ev) => {
          if (ev.candidate) {
            s.emit('ice-candidate', { target: from, candidate: ev.candidate });
          }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        s.emit('answer', { target: from, sdp: answer });
      } catch (err) {
        console.error(err);
      }
    });

    // incoming ICE candidate
    s.on('ice-candidate', async ({ candidate, from }) => {
      const pc = pcRef.current;
      if (pc && candidate) {
        try { await pc.addIceCandidate(candidate); } catch(e){ console.warn(e); }
      }
    });

    s.on('watch-error', (err) => {
      alert('Cannot watch: ' + err.message);
    });

    return () => s.disconnect();
  }, []);

  async function requestWatch(){
    if(!socket) return;
    if(!user.assignedCaretaker) {
      alert('No assigned caretaker. Ask admin to assign you.');
      return;
    }
    socket.emit('watch', { caretakerId: user.assignedCaretaker });
  }

  return (
    <div style={{ padding: 10 }}>
      <h2>Parent UI — {user.username}</h2>
      <p>Assigned caretaker ID: {user.assignedCaretaker || '—'}</p>

      <div>
        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: 480, height: 360, background: '#000' }} />
      </div>

      <div style={{ marginTop: 8 }}>
        <button onClick={requestWatch}>Watch Assigned Caretaker</button>
        <button onClick={() => { logout(); window.location.reload(); }} style={{ marginLeft: 8 }}>Logout</button>
      </div>

      <div style={{ marginTop: 18 }}>
        <h3>Chat</h3>
        <Chat socket={socket} caretakerId={user.assignedCaretaker} myChild={user.child} />
      </div>
    </div>
  );
}
