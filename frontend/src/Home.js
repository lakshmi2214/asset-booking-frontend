import React from 'react';
import { Container, Row, Col, Button, Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div style={{ backgroundColor: '#f8f9fc', minHeight: '80vh' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '80px 0',
          color: 'white',
          marginBottom: '40px',
        }}
      >
        <Container>
          <Row className="align-items-center">
            <Col md={8}>
              <h1 style={{ fontWeight: 700, fontSize: '2.5rem', marginBottom: '20px' }}>
                Asset Booking System
              </h1>
              <p style={{ fontSize: '1.2rem', marginBottom: '30px', opacity: 0.9 }}>
                Book equipment, cameras, laptops, and other assets easily. 
                Manage your bookings and track availability in real-time.
              </p>
              <div className="d-flex gap-3">
                <Button as={Link} to="/book-asset" variant="light" size="lg">
                  Book Asset
                </Button>
                <Button as={Link} to="/assets" variant="outline-light" size="lg">
                  View Assets
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container>
        <Row className="g-4 mb-5">
          <Col md={4}>
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="text-center p-4">
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📷</div>
                <Card.Title>Cameras & Equipment</Card.Title>
                <Card.Text className="text-muted">
                  Book professional cameras, drones, and audio equipment for your projects.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="text-center p-4">
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>💻</div>
                <Card.Title>Laptops & Devices</Card.Title>
                <Card.Text className="text-muted">
                  Reserve laptops, tablets, and other computing devices when you need them.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="text-center p-4">
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📅</div>
                <Card.Title>Easy Scheduling</Card.Title>
                <Card.Text className="text-muted">
                  Pick your dates, fill in your details, and confirm your booking instantly.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="align-items-center py-5">
          <Col lg={6}>
            <h2 style={{ fontWeight: 700, marginBottom: '20px' }}>How It Works</h2>
            <div className="d-flex align-items-start mb-3">
              <Badge bg="primary" className="me-3 p-2">1</Badge>
              <div>
                <h5>Create an Account</h5>
                <p className="text-muted mb-0">Sign up with your details to get started.</p>
              </div>
            </div>
            <div className="d-flex align-items-start mb-3">
              <Badge bg="primary" className="me-3 p-2">2</Badge>
              <div>
                <h5>Browse Assets</h5>
                <p className="text-muted mb-0">View available equipment and their details.</p>
              </div>
            </div>
            <div className="d-flex align-items-start mb-3">
              <Badge bg="primary" className="me-3 p-2">3</Badge>
              <div>
                <h5>Book Your Asset</h5>
                <p className="text-muted mb-0">Select dates, fill your info, and confirm.</p>
              </div>
            </div>
            <div className="d-flex align-items-start">
              <Badge bg="primary" className="me-3 p-2">4</Badge>
              <div>
                <h5>Track Your Bookings</h5>
                <p className="text-muted mb-0">View and manage all your bookings in one place.</p>
              </div>
            </div>
          </Col>
          <Col lg={6} className="text-center">
            <div
              style={{
                background: 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)',
                borderRadius: '16px',
                padding: '40px',
                color: 'white',
              }}
            >
              <h3 style={{ fontWeight: 700 }}>Ready to get started?</h3>
              <p className="mb-4">Create an account and start booking assets today.</p>
              <Button as={Link} to="/signup" variant="light" size="lg">
                Sign Up Now
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Home;
