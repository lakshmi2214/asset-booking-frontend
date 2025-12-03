import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import Signup from './Signup';
import Login from './Login';
import AssetList from './AssetList';
import AssetDetail from './AssetDetail';
import BookingList from './BookingList';
import Home from './Home';
import BookingForm from './BookingForm';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access');
    if (token) {
      setUser(token);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <Router>
      <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
        <Container>
          <Navbar.Brand as={Link} to="/">Asset Booking</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">Home</Nav.Link>
              {user && <Nav.Link as={Link} to="/assets">Assets</Nav.Link>}
              {user && <Nav.Link as={Link} to="/book-asset">Book Asset</Nav.Link>}
              {user && <Nav.Link as={Link} to="/bookings">My Bookings</Nav.Link>}
            </Nav>
            <Nav>
              {user ? (
                <Button variant="outline-light" onClick={handleLogout}>Logout</Button>
              ) : (
                <>
                  <Nav.Link as={Link} to="/login">Login</Nav.Link>
                  <Nav.Link as={Link} to="/signup">Signup</Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="mt-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup setUser={setUser} />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/assets" element={user ? <AssetList /> : <Login setUser={setUser} />} />
          <Route path="/assets/:id" element={user ? <AssetDetail /> : <Login setUser={setUser} />} />
          <Route path="/book-asset" element={user ? <BookingForm /> : <Login setUser={setUser} />} />
          <Route path="/bookings" element={user ? <BookingList /> : <Login setUser={setUser} />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;
