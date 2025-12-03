import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Container, Row, Col, Badge, Form, Spinner, Alert } from 'react-bootstrap';
import { API_BASE } from './auth';

export default function AssetList() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/v1/assets/`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setAssets(data);
        setError('');
      })
      .catch((err) => {
        setError('Failed to load assets. Please check if the server is running.');
      })
      .finally(() => setLoading(false));
  }, []);

  const locations = useMemo(() => {
    const map = new Map();
    assets.forEach((a) => {
      if (a.location) map.set(a.location.id, a.location);
    });
    return Array.from(map.values());
  }, [assets]);

  const filteredAssets = useMemo(() => {
    if (!filterLocation) return assets;
    return assets.filter((a) => a.location && a.location.id === Number(filterLocation));
  }, [assets, filterLocation]);

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading assets...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">Available Assets</h2>

      {locations.length > 0 && (
        <Form.Group className="mb-4" style={{ maxWidth: '300px' }}>
          <Form.Label>Filter by Location:</Form.Label>
          <Form.Select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      )}

      <Row className="g-4">
        {filteredAssets.map((asset) => (
          <Col key={asset.id} xs={12} sm={6} md={4} lg={3}>
            <Card className="h-100 shadow-sm">
              {asset.image_url ? (
                <Card.Img
                  variant="top"
                  src={asset.image_url}
                  style={{ height: '180px', objectFit: 'cover' }}
                  alt={asset.name}
                />
              ) : (
                <div
                  style={{
                    height: '180px',
                    backgroundColor: '#e9ecef',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                  }}
                >
                  No Image
                </div>
              )}
              <Card.Body>
                <Card.Title>{asset.name}</Card.Title>
                {asset.serial_number && (
                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
                    SN: {asset.serial_number}
                  </div>
                )}
                {asset.location && (
                  <Badge bg="info" className="mb-2">
                    {asset.location.name}
                  </Badge>
                )}
                <Card.Text className="text-muted" style={{ fontSize: '0.9rem' }}>
                  {asset.description || 'No description'}
                </Card.Text>
                <Badge bg={asset.available ? 'success' : 'danger'}>
                  {asset.available ? 'Available' : 'Unavailable'}
                </Badge>
              </Card.Body>
              <Card.Footer className="bg-white border-0">
                <Link to={`/assets/${asset.id}`}>
                  <Button variant="primary" size="sm" className="w-100">
                    View Details
                  </Button>
                </Link>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>

      {filteredAssets.length === 0 && (
        <Alert variant="info" className="mt-4">
          No assets found.
        </Alert>
      )}
    </Container>
  );
}
