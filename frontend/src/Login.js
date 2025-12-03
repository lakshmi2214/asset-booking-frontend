import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Container, Alert, Card } from 'react-bootstrap';
import { API_BASE } from './auth';

export default function Login({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    if (!username || !password) {
      setMsg('Please enter username and password');
      return;
    }
    try {
      setLoading(true);
      setMsg('');
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
        const t = await tokenRes.json().catch(() => ({}));
        setMsg(t.detail || 'Invalid username or password');
      }
    } catch (err) {
      setMsg('Connection error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container style={{ maxWidth: '420px', marginTop: '50px' }}>
      <Card className="shadow-sm">
        <Card.Body className="p-4">
          <h2 className="text-center mb-4">Login</h2>
          <Form onSubmit={submit}>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </Form>
          {msg && (
            <Alert variant="danger" className="mt-3 mb-0">
              {msg}
            </Alert>
          )}
          <div className="text-center mt-3">
            <span className="text-muted">Don't have an account? </span>
            <Link to="/signup">Sign up</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
