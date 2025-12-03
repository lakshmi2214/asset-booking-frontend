import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { authorizedFetch, getValidAccessToken, clearTokens, API_BASE } from './auth';

export default function BookingList() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);
    setError('');
    try {
      const token = await getValidAccessToken();
      if (!token) {
        setError('Please login to view bookings.');
        setLoading(false);
        return;
      }
      const res = await authorizedFetch(`${API_BASE}/api/v1/bookings/`);
      if (!res.ok) {
        if (res.status === 401) {
          clearTokens();
          setError('Session expired. Please login again.');
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.results || [];
      setBookings(list);
    } catch (err) {
      if (err.message === 'AUTH_REQUIRED') {
        setError('Please login to view bookings.');
      } else {
        setError('Failed to load bookings.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function cancelBooking(id) {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      const res = await authorizedFetch(`${API_BASE}/api/v1/bookings/${id}/cancel/`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: data.status || 'cancelled' } : b))
        );
      } else {
        alert('Failed to cancel booking');
      }
    } catch {
      alert('Error cancelling booking');
    }
  }

  function formatDate(val) {
    if (!val) return '—';
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toLocaleString();
  }

  function getStatusBadge(status) {
    const variants = {
      pending: 'warning',
      accepted: 'success',
      rejected: 'danger',
      cancelled: 'secondary',
    };
    return variants[status] || 'secondary';
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading bookings...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4">My Bookings</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {!error && bookings.length === 0 && (
        <Alert variant="info">You have no bookings yet.</Alert>
      )}
      <Row className="g-3">
        {bookings.map((b) => (
          <Col key={b.id} xs={12} md={6} lg={4}>
            <Card className="h-100 shadow-sm">
              {b.asset?.image_url ? (
                <Card.Img
                  variant="top"
                  src={b.asset.image_url}
                  style={{ height: '160px', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    height: '160px',
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
                <Card.Title>{b.asset?.name || 'Asset'}</Card.Title>
                <div className="mb-2">
                  <Badge bg={getStatusBadge(b.status)} className="me-2">
                    {b.status?.charAt(0).toUpperCase() + b.status?.slice(1) || 'Pending'}
                  </Badge>
                  {b.asset?.location && <Badge bg="info">{b.asset.location.name}</Badge>}
                </div>
                <div style={{ fontSize: '0.9rem' }}>
                  <div><strong>Start:</strong> {formatDate(b.start_datetime)}</div>
                  <div><strong>End:</strong> {formatDate(b.end_datetime)}</div>
                  {b.purpose && <div className="mt-2 text-muted">{b.purpose}</div>}
                </div>
              </Card.Body>
              {(!b.status || b.status === 'pending') && (
                <Card.Footer className="bg-white border-0">
                  <Button variant="outline-danger" size="sm" onClick={() => cancelBooking(b.id)}>
                    Cancel Booking
                  </Button>
                </Card.Footer>
              )}
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
