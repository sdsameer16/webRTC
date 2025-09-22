import React, { useState, useEffect } from 'react';

export default function Chat({ socket, caretakerId, myChild }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if(!socket) return;
    const handler = (msg) => {
      setMessages(prev => [...prev, msg]);
    };
    socket.on('chat-message', handler);
    return () => socket.off('chat-message', handler);
  }, [socket]);

  function send() {
    if(!text) return;
    const payload = {
      caretakerId,
      childId: myChild?.id || '',
      childName: myChild?.name || '',
      message: text
    };
    socket.emit('chat-message', payload);
    setText('');
  }

  return (
    <div style={{ border: '1px solid #ddd', padding: 8, width: 350 }}>
      <h4>Chat (child: {myChild?.name || '—'} / ID: {myChild?.id || '—'})</h4>
      <div style={{ height: 200, overflowY: 'auto', border: '1px solid #eee', padding: 6 }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: '#777' }}>
              <strong>{m.from.username}</strong> ({m.from.role}) • {new Date(m.time).toLocaleTimeString()}
            </div>
            <div style={{ fontSize: 14 }}>{m.message}</div>
            <div style={{ fontSize: 12, color:'#333' }}>
              <em>Child: {m.childName || '—'} ({m.childId || '—'})</em>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <input value={text} onChange={(e)=>setText(e.target.value)} placeholder="Message..." style={{ width: '100%' }} />
        <button onClick={send} style={{ marginTop: 6 }}>Send</button>
      </div>
    </div>
  );
}
