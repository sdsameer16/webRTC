import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE, setToken, setUser } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

export default function Login(){
  const [username,setUsername] = useState('');
  const [password,setPassword] = useState('');
  const [mode,setMode] = useState('login'); // or 'register'
  const [role,setRole] = useState('parent');
  const [childName,setChildName] = useState('');
  const [childId,setChildId] = useState('');
  const navigate = useNavigate();

  async function handleLogin(e){
    e.preventDefault();
    try {
      const res = await axios.post(API_BASE + '/auth/login', { username, password });
      setToken(res.data.token);
      setUser(res.data.user);
      if(res.data.user.role === 'admin') navigate('/admin');
      else if(res.data.user.role === 'caretaker') navigate('/caretaker');
      else navigate('/parent');
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    }
  }

  async function handleRegister(e){
    e.preventDefault();
    try {
      const payload = { username, password, role };
      if (role === 'parent') { payload.childName = childName; payload.childId = childId; }
      await axios.post(API_BASE + '/auth/register', payload);
      alert('Registered. Now login.');
      setMode('login');
    } catch (err) {
      alert(err.response?.data?.message || 'Register failed');
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>{mode === 'login' ? 'Login' : 'Register (dev)'}</h2>
      <form onSubmit={mode==='login' ? handleLogin : handleRegister}>
        <div>
          <label>Username</label><br />
          <input value={username} onChange={e=>setUsername(e.target.value)} required />
        </div>
        <div>
          <label>Password</label><br />
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>

        {mode === 'register' && (
          <>
            <div>
              <label>Role</label><br />
              <select value={role} onChange={e => setRole(e.target.value)}>
                <option value="parent">Parent</option>
                <option value="caretaker">Caretaker</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {role === 'parent' && (
              <>
                <div><label>Child Name</label><br />
                <input value={childName} onChange={e => setChildName(e.target.value)} /></div>
                <div><label>Child ID</label><br />
                <input value={childId} onChange={e => setChildId(e.target.value)} /></div>
              </>
            )}
          </>
        )}

        <div style={{ marginTop: 10 }}>
          <button type="submit">{mode === 'login' ? 'Login' : 'Register'}</button>
          <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ marginLeft: 10 }}>
            {mode === 'login' ? 'Register (dev)' : 'Back to login'}
          </button>
        </div>
      </form>
    </div>
  );
}
