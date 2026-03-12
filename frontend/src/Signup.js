import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import { API_BASE, mockLogin, mockSignup, isStandaloneMode, setStandaloneMode } from './auth';

export default function Signup({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    if (!username || !password) {
      setMsg('Please enter username and password');
      return;
    }
    if (password.length < 3) {
      setMsg('Password must be at least 3 characters');
      return;
    }

    const requestData = {
      username,
      password,
      email: email || undefined,
      first_name: fullName || undefined,
      phone: mobile || undefined
    };

    try {
      setMsg('Signing up...');

      const res = await fetch(`${API_BASE}/api/v1/auth/signup/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (res.ok) {
        // Auto-login after signup
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
          setMsg('Signup successful');
          navigate('/');
        } else {
          setMsg('Signup succeeded but token obtain failed');
          navigate('/login');
        }
      } else {
        try {
          const t = await res.json();
          setMsg('Error: ' + (t.detail || JSON.stringify(t)));
        } catch (e) {
          setMsg('Error: ' + res.status + ' ' + res.statusText);
        }
      }
    } catch (err) {
      console.error('Signup error:', err);
      setMsg('Error: ' + err.message);
    }
  }


  return (
    <Container style={{ maxWidth: '450px', marginTop: '50px' }}>
      <h2>Create Account</h2>
      <Form onSubmit={submit}>
        <Form.Group className="mb-3">
          <Form.Label>Full Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Mobile Number</Form.Label>
          <Form.Control
            type="tel"
            placeholder="Enter mobile number"
            value={mobile}
            onChange={e => setMobile(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Username *</Form.Label>
          <Form.Control
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Password *</Form.Label>
          <Form.Control
            type="password"
            placeholder="Choose a password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </Form.Group>
        <Button variant="success" type="submit" className="w-100">Sign Up</Button>
      </Form>
      {msg && (
        <Alert variant={msg.includes('Error') ? 'danger' : 'success'} className="mt-3">
          {msg}
        </Alert>
      )}
    </Container>
  );
}
