import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Container, Alert, Card } from 'react-bootstrap';
import { API_BASE } from './auth';

export default function Signup({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    if (!username || !password) {
      setMsg('Username and password are required');
      return;
    }
    if (password.length < 4) {
      setMsg('Password must be at least 4 characters');
      return;
    }
    try {
      setLoading(true);
      setMsg('');
      const res = await fetch(`${API_BASE}/api/v1/auth/signup/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          email: email || undefined,
          first_name: fullName || undefined,
          phone: mobile || undefined,
        }),
      });
      if (res.ok) {
        const tokenRes = await fetch(`${API_BASE}/api/v1/auth/token/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        if (tokenRes.ok) {
          const tokens = await tokenRes.json();
          localStorage.setItem('access', tokens.access);
          localStorage.setItem('refresh', tokens.refresh);
          setUser(tokens.access);
          navigate('/');
        } else {
          setMsg('Account created! Please login.');
          navigate('/login');
        }
      } else {
        const t = await res.json().catch(() => ({}));
        setMsg(t.detail || t.username?.[0] || 'Signup failed');
      }
    } catch (err) {
      setMsg('Connection error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container style={{ maxWidth: '450px', marginTop: '40px' }}>
      <Card className="shadow-sm">
        <Card.Body className="p-4">
          <h2 className="text-center mb-4">Create Account</h2>
          <Form onSubmit={submit}>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mobile Number</Form.Label>
              <Form.Control
                type="tel"
                placeholder="Enter mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                disabled={loading}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Username *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Password *</Form.Label>
              <Form.Control
                type="password"
                placeholder="Choose a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </Form.Group>
            <Button variant="success" type="submit" className="w-100" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </Form>
          {msg && (
            <Alert variant={msg.includes('created') ? 'success' : 'danger'} className="mt-3 mb-0">
              {msg}
            </Alert>
          )}
          <div className="text-center mt-3">
            <span className="text-muted">Already have an account? </span>
            <Link to="/login">Login</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
