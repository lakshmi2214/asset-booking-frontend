import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Spinner } from 'react-bootstrap';
import { API_BASE, isStandaloneMode } from './auth';

export default function AssetDetail() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadData = async () => {
      // 1. Check for standalone mode
      if (isStandaloneMode()) {
        if (isMounted) {
          import('./mockData').then(m => {
            const safeMockAssets = Array.isArray(m.MOCK_ASSETS) ? m.MOCK_ASSETS : [];
            const mockAsset = safeMockAssets.find(a => String(a.id) === String(id));
            if (mockAsset) {
              setAsset(mockAsset);
              setError(null);
            } else {
              setError('Failed to load asset details');
            }
            setLoading(false);
          }).catch(() => {
            setError('Failed to load asset details');
            setLoading(false);
          });
        }
        return;
      }

      // 2. Try fetch with timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${API_BASE}/api/v1/assets/${id}/`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (isMounted) {
          setAsset(data);
          setError(null);
        }
      } catch (err) {
        console.error('Error loading asset, falling back to mock:', err);
        if (isMounted) {
          import('./mockData').then(m => {
            const safeMockAssets = Array.isArray(m.MOCK_ASSETS) ? m.MOCK_ASSETS : [];
            const mockAsset = safeMockAssets.find(a => String(a.id) === String(id));
            if (mockAsset) {
              setAsset(mockAsset);
              setError(null);
            } else {
              setError('Failed to load asset details');
            }
          }).catch(() => {
            setError('Failed to load asset details');
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [id]);

  if (loading) return (
    <Container className="text-center mt-5">
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      <p className="mt-2">Loading asset details...</p>
    </Container>
  );

  if (error) return (
    <Container className="mt-5">
      <div className="alert alert-danger">{error}</div>
      <Link to="/assets">
        <Button variant="secondary">Back to Assets</Button>
      </Link>
    </Container>
  );

  if (!asset) return (
    <Container className="mt-5">
      <div className="alert alert-warning">Asset not found</div>
      <Link to="/assets">
        <Button variant="secondary">Back to Assets</Button>
      </Link>
    </Container>
  );

  return (
    <Container className="mt-4">
      <Link to="/assets" className="mb-3 d-inline-block">
        <Button variant="outline-secondary">← Back to Assets</Button>
      </Link>

      <Row className="mt-4">
        <Col md={6}>
          {asset.image_url ? (
            <div>
              <img
                src={asset.image_url}
                alt={asset.name}
                style={{ width: '100%', borderRadius: '8px', maxHeight: '500px', objectFit: 'cover' }}
              />
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                height: '400px',
                backgroundColor: '#e9ecef',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                color: '#999'
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
                <Badge
                  bg={asset.status?.includes('Available') ? 'success' : 'danger'}
                  className="me-2"
                >
                  {asset.status || (asset.available ? 'Available' : 'Not Available')}
                </Badge>
                {asset.total_quantity > 1 && (
                  <Badge bg="secondary" className="me-2">
                    Total Units: {asset.total_quantity}
                  </Badge>
                )}
                {asset.location && (
                  <Badge bg="info">
                    Location: {asset.location.name}
                  </Badge>
                )}
              </div>

              {asset.serial_number && (
                <div className="mb-3">
                  <strong>Serial Number:</strong>
                  <p>{asset.serial_number}</p>
                </div>
              )}

              {asset.description && (
                <div className="mb-3">
                  <strong>Description:</strong>
                  <p>{asset.description}</p>
                </div>
              )}

              {asset.details && (
                <div className="mb-3">
                  <strong>Specifications:</strong>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{asset.details}</p>
                </div>
              )}

              {asset.location && (
                <div className="mb-3">
                  <strong>Current Location:</strong>
                  <p>
                    {asset.location.name}
                    {asset.location.description && ` - ${asset.location.description}`}
                  </p>
                </div>
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
