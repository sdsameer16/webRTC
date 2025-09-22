import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE, getToken, getUser, logout } from '../utils/auth';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [username,setUsername] = useState('');
  const [password,setPassword] = useState('');
  const [role,setRole] = useState('caretaker');
  const [childName,setChildName] = useState('');
  const [childId,setChildId] = useState('');
  const [selectedParent, setSelectedParent] = useState('');
  const [selectedCaretaker, setSelectedCaretaker] = useState('');
  const myUser = getUser();

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers(){
    try {
      const res = await axios.get(API_BASE + '/admin/users', { headers: { Authorization: 'Bearer ' + getToken() } });
      setUsers(res.data);
    } catch (err) {
      alert('Failed to fetch users');
    }
  }

  async function createUser(e){
    e.preventDefault();
    try {
      await axios.post(API_BASE + '/admin/create-user', { username, password, role, childName, childId }, { headers: { Authorization: 'Bearer ' + getToken() }});
      alert('User created');
      setUsername(''); setPassword('');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Create failed');
    }
  }

  async function assignParent(e){
    e.preventDefault();
    if(!selectedParent || !selectedCaretaker) return alert('Select both');
    try {
      await axios.post(API_BASE + '/admin/assign-parent', { parentId: selectedParent, caretakerId: selectedCaretaker }, { headers: { Authorization: 'Bearer ' + getToken() }});
      alert('Assigned');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Assign failed');
    }
  }

  return (
    <div style={{ padding: 10 }}>
      <h2>Admin Dashboard — {myUser.username}</h2>
      <button onClick={() => { logout(); window.location.reload(); }}>Logout</button>

      <h3 style={{ marginTop: 10 }}>Create User</h3>
      <form onSubmit={createUser}>
        <div><input value={username} onChange={e=>setUsername(e.target.value)} placeholder="username" required /></div>
        <div><input value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" required /></div>
        <div>
          <select value={role} onChange={e=>setRole(e.target.value)}>
            <option value="caretaker">Caretaker</option>
            <option value="parent">Parent</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {role === 'parent' && (
          <>
            <div><input value={childName} onChange={e=>setChildName(e.target.value)} placeholder="Child Name" /></div>
            <div><input value={childId} onChange={e=>setChildId(e.target.value)} placeholder="Child ID" /></div>
          </>
        )}
        <button type="submit">Create</button>
      </form>

      <h3 style={{ marginTop: 20 }}>Users</h3>
      <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #eee', padding: 8 }}>
        {users.map(u => (
          <div key={u._id} style={{ marginBottom: 6 }}>
            <strong>{u.username}</strong> ({u.role}) — child: {(u.child && u.child.name) || '—'} ({(u.child && u.child.id) || '—'}) — assignedCaretaker: {u.assignedCaretaker || '—'}
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 20 }}>Assign Parent to Caretaker</h3>
      <form onSubmit={assignParent}>
        <select value={selectedParent} onChange={e=>setSelectedParent(e.target.value)}>
          <option value="">Select Parent</option>
          {users.filter(u => u.role === 'parent').map(p => <option key={p._id} value={p._id}>{p.username} — {p.child?.name}</option>)}
        </select>
        <select value={selectedCaretaker} onChange={e=>setSelectedCaretaker(e.target.value)}>
          <option value="">Select Caretaker</option>
          {users.filter(u => u.role === 'caretaker').map(c => <option key={c._id} value={c._id}>{c.username}</option>)}
        </select>
        <button type="submit">Assign</button>
      </form>
    </div>
  );
}
