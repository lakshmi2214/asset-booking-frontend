import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button, Badge } from 'react-bootstrap';
import Signup from './Signup';
import Login from './Login';
import AssetList from './AssetList';
import AssetDetail from './AssetDetail';
import BookingList from './BookingList';
import Home from './Home';
import AssetBooking from './BookingForm';
import VerifyEmail from './VerifyEmail';
import Footer from './Footer';
import ChatBot from './ChatBot';

import { API_BASE, isStandaloneMode } from './auth';

function App() {
  const [user, setUser] = useState(() => localStorage.getItem('access'));
  const [demoMode, setDemoMode] = useState(isStandaloneMode());

  useEffect(() => {
    // Check for demo mode changes
    const interval = setInterval(() => {
        const current = isStandaloneMode();
        if (current !== demoMode) setDemoMode(current);
    }, 2000);
    return () => clearInterval(interval);
  }, [demoMode]);

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setUser(null);
    window.location.href = '#/login';
  };

  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Navbar variant="dark" expand="lg" sticky="top" className="shadow-sm">
          <Container>
            <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
              <div style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #6366f1 0%, #f43f5e 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 800,
                fontSize: '1rem'
              }}>A</div>
              <div className="d-flex flex-column">
                <span style={{ fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 }}>AssetFlow</span>
                {demoMode && <span style={{ fontSize: '0.65rem', color: '#f43f5e', fontWeight: 700, letterSpacing: '1px' }}>DEMO MODE</span>}
              </div>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto ms-lg-4 gap-2">
                <Nav.Link as={Link} to="/" className="px-3">Home</Nav.Link>
                {user && <Nav.Link as={Link} to="/assets" className="px-3">Inventory</Nav.Link>}
                {user && <Nav.Link as={Link} to="/book-asset" className="px-3">Reservations</Nav.Link>}
                {user && <Nav.Link as={Link} to="/bookings" className="px-3">My History</Nav.Link>}
              </Nav>
              <Nav className="gap-2 align-items-center">
                {demoMode && (
                   <Badge bg="danger" className="me-2 d-none d-lg-block" style={{ fontSize: '0.7rem' }}>
                     OFFLINE MODE
                   </Badge>
                )}
                {user ? (
                  <Button variant="link" className="text-light text-decoration-none fw-bold" onClick={handleLogout}>
                    Sign Out
                  </Button>
                ) : (
                  <>
                    <Nav.Link as={Link} to="/login" className="px-3">Sign In</Nav.Link>
                    <Button as={Link} to="/signup" className="btn-premium btn-premium-primary py-2 px-4 shadow-none">
                      Join Free
                    </Button>
                  </>
                )}
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>


        <Container className="mt-4 flex-grow-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<Signup setUser={setUser} />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/login" element={<Login setUser={setUser} />} />

            <Route path="/assets" element={user ? <AssetList /> : <Navigate to="/login" />} />
            <Route path="/assets/:id" element={user ? <AssetDetail /> : <Navigate to="/login" />} />
            <Route path="/book-asset" element={user ? <AssetBooking /> : <Navigate to="/login" />} />
            <Route path="/bookings" element={user ? <BookingList /> : <Navigate to="/login" />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Container>

        <ChatBot />
        <Footer />
      </div>
    </Router>
  );
}

export default App;
