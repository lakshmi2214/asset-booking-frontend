import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { API_BASE } from './auth';

export default function AssetDetail() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/v1/assets/${id}/`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setAsset(data);
        setError('');
      })
      .catch(() => {
        setError('Failed to load asset details');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading...</p>
      </Container>
    );
  }

  if (error || !asset) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error || 'Asset not found'}</Alert>
        <Link to="/assets">
          <Button variant="secondary">Back to Assets</Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Link to="/assets" className="mb-3 d-inline-block">
        <Button variant="outline-secondary">← Back to Assets</Button>
      </Link>

      <Row className="mt-4">
        <Col md={6}>
          {asset.image_url ? (
            <img
              src={asset.image_url}
              alt={asset.name}
              style={{ width: '100%', borderRadius: '8px', maxHeight: '450px', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '350px',
                backgroundColor: '#e9ecef',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: '1.2rem',
              }}
            >
              No Image Available
            </div>
          )}
        </Col>
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Body>
              <h3 className="mb-3">{asset.name}</h3>
              <div className="mb-3">
                <Badge bg={asset.available ? 'success' : 'danger'} className="me-2">
                  {asset.available ? 'Available' : 'Unavailable'}
                </Badge>
                {asset.location && <Badge bg="info">Location: {asset.location.name}</Badge>}
              </div>
              {asset.serial_number && (
                <p>
                  <strong>Serial Number:</strong> {asset.serial_number}
                </p>
              )}
              {asset.description && (
                <p>
                  <strong>Description:</strong> {asset.description}
                </p>
              )}
              {asset.details && (
                <p style={{ whiteSpace: 'pre-wrap' }}>
                  <strong>Details:</strong> {asset.details}
                </p>
              )}
              <Link to="/book-asset">
                <Button variant="primary" size="lg" className="w-100 mt-3">
                  Book This Asset
                </Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
