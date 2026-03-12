import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import { API_BASE, mockLogin, isStandaloneMode, setStandaloneMode } from './auth';

export default function Login({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    if (!username || !password) {
      setMsg('Please enter username and password');
      return;
    }
    try {
      setMsg('Logging in...');
      const tokenRes = await fetch(`${API_BASE}/api/v1/auth/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (tokenRes.ok) {
        const tokens = await tokenRes.json();
        localStorage.setItem('access', tokens.access);
        localStorage.setItem('refresh', tokens.refresh);
        setUser(tokens.access);
        setMsg('Login successful');
        navigate('/');
      } else {
        if (tokenRes.status === 500) {
          setMsg('Error: Backend encountered a problem (Status 500).');
        } else {
          try {
            const t = await tokenRes.json();
            setMsg('Error: ' + (t.detail || JSON.stringify(t)));
          } catch (e) {
            setMsg('Error: Login failed (Status ' + tokenRes.status + ')');
          }
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setMsg('Error: ' + err.message);
    }
  }

  return (
    <Container style={{ maxWidth: '400px', marginTop: '50px' }}>
      <h2>Sign In</h2>
      <Form onSubmit={submit}>
        <Form.Group className="mb-3">
          <Form.Label>Username</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </Form.Group>
        <Button variant="primary" type="submit" className="w-100">Login</Button>
      </Form>
      {msg && (
        <Alert variant={msg.includes('Error') ? 'danger' : 'success'} className="mt-3">
          {msg}
        </Alert>
      )}
    </Container>
  );
}
