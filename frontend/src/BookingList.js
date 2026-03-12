import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Badge, Alert, Modal, Form } from 'react-bootstrap';
import { authorizedFetch, getValidAccessToken, clearTokens, API_BASE } from './auth';

export default function BookingList() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showImageModal, setShowImageModal] = useState(false);
  const [uploadAction, setUploadAction] = useState(null); // 'receive' or 'return'
  const [selectedFile, setSelectedFile] = useState(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('Changed my mind');
  const [otherReason, setOtherReason] = useState('');
  const [isOther, setIsOther] = useState(false);

  const cancellationOptions = [
    'Changed my mind',
    'Found better alternative',
    'Schedule conflict',
    'Booking error',
    'Technical issue',
    'Other'
  ];

  useEffect(() => {
    let active = true;

    async function loadBookings() {
      setError('');
      try {
        const token = await getValidAccessToken();
        if (!token) {
          if (active) {
            setError('Please login again.');
          }
          return;
        }
        const response = await authorizedFetch(`${API_BASE}/api/v1/bookings/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          if (response.status === 401) {
            clearTokens();
            if (active) {
              setError('Session expired. Please login again.');
            }
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (active) {
          const normalized = Array.isArray(data)
            ? data
            : Array.isArray(data?.results)
              ? data.results
              : [];
          setBookings(normalized);
        }
      } catch (err) {
        console.error('Error loading bookings:', err);
        if (active) {
          if (err.message === 'AUTH_REQUIRED') {
            clearTokens();
            setError('Session expired. Please login again.');
          } else {
            setError('Failed to load bookings. Please try again.');
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadBookings();

    return () => {
      active = false;
    };
  }, []);

  function formatDate(value) {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date.toLocaleString();
  }

  function formatStatusLabel(status) {
    if (!status) {
      return 'Pending';
    }
    if (status === 'cancellation_requested') {
      return 'Cancellation Requested';
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  function getStatusVariant(status) {
    switch (status) {
      case 'accepted':
        return 'success';
      case 'received':
        return 'primary';
      case 'returned':
        return 'secondary';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'danger';
      case 'cancelled':
        return 'dark';
      case 'cancellation_requested':
        return 'info';
      default:
        return 'secondary';
    }
  }

  function openCancelModal(id) {
    setSelectedBookingId(id);
    setCancelReason('Changed my mind');
    setOtherReason('');
    setIsOther(false);
    setShowCancelModal(true);
  }

  function openImageModal(id, action) {
    setSelectedBookingId(id);
    setUploadAction(action);
    setSelectedFile(null);
    setShowImageModal(true);
  }

  async function handleImageSubmit() {
    if (!selectedBookingId || !selectedFile || !uploadAction) return;

    const endpoint = uploadAction === 'receive' ? 'receive' : 'return_asset';
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await authorizedFetch(`${API_BASE}/api/v1/bookings/${selectedBookingId}/${endpoint}/`, {
        method: 'POST',
        body: formData, // Check if authorizedFetch handles FormData correctly (it should if content-type header is omitted/undefined to let browser set boundary)
        headers: {} // Empty headers to let browser set Content-Type with boundary
      });

      if (!response.ok) {
        const errData = await response.json();
        alert(`Error: ${errData.detail || 'Action failed'}`);
        return;
      }

      const updatedBooking = await response.json();

      setBookings(current => current.map(b => b.id === selectedBookingId ? updatedBooking : b));
      setShowImageModal(false);

      if (uploadAction === 'return') {
        alert('Asset returned successfully. Logging out...');
        clearTokens();
        window.location.href = '#/login';
      }

    } catch (err) {
      console.error(err);
      alert('An error occurred during upload.');
    }
  }

  async function confirmCancel() {
    if (!selectedBookingId) return;

    const finalReason = isOther ? otherReason : cancelReason;
    if (isOther && !otherReason.trim()) {
      alert('Please provide a reason for cancellation.');
      return;
    }

    try {
      const res = await authorizedFetch(`${API_BASE}/api/v1/bookings/${selectedBookingId}/cancel/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: finalReason }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          clearTokens();
          alert('Session expired. Please login again.');
          return;
        }
        alert('Cancel failed: ' + res.status);
        setShowCancelModal(false);
        return;
      }
      const data = await res.json();
      setBookings((current) => current.map((b) => (b.id === selectedBookingId ? { ...b, status: data.status || 'cancellation_requested' } : b)));
      setShowCancelModal(false);
    } catch (err) {
      if (err.message === 'AUTH_REQUIRED') {
        clearTokens();
        alert('Session expired. Please login again.');
      } else {
        alert('Error: ' + err.message);
      }
      setShowCancelModal(false);
    }
  }

  return (
    <div>
      <h2>My Bookings</h2>
      {loading && <div style={{ padding: '40px 0', textAlign: 'center' }}>Loading...</div>}
      {!loading && error && <Alert variant="danger">{error}</Alert>}
      {!loading && !error && bookings.length === 0 && (
        <Alert variant="info">You have no bookings yet.</Alert>
      )}
      {!loading && !error && bookings.length > 0 && (
        <Row className="g-3">
          {bookings.map((b) => (
            <Col key={b.id} xs={12} sm={12} md={6} lg={4}>
              <Card className="h-100 asset-card">
                <div className="asset-img-container">
                  {b.asset && b.asset.image_url ? (
                    <Card.Img
                      variant="top"
                      src={b.asset.image_url}
                      alt={b.asset.name}
                      className="asset-card-img"
                    />
                  ) : (
                    <div style={{ height: '100%', backgroundColor: '#f1f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#adb5bd' }}>No Image</span>
                    </div>
                  )}
                  {/* Overlay Status for Booking */}
                  <div style={{ position: 'absolute', top: 10, right: 10 }}>
                    <Badge bg={getStatusVariant(b.status)} className="shadow-sm">
                      {formatStatusLabel(b.status)}
                    </Badge>
                  </div>
                </div>

                <Card.Body className="asset-card-body">
                  <Card.Title className="asset-card-title">
                    {(b.asset && b.asset.name) || 'Asset'}
                  </Card.Title>

                  {b.asset && b.asset.serial_number && (
                    <div className="mb-2 text-muted small">
                      Serial: {b.asset.serial_number}
                    </div>
                  )}

                  <div className="mb-3 text-secondary" style={{ fontSize: '0.9rem' }}>
                    <div className="d-flex justify-content-between">
                      <span><strong>Quantity:</strong></span>
                      <span><Badge bg="info" text="dark" style={{ fontSize: '0.75rem' }}>{b.quantity || 1} Unit(s)</Badge></span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span><strong>Start:</strong></span>
                      <span>{formatDate(b.start_datetime)}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span><strong>End:</strong></span>
                      <span>{formatDate(b.end_datetime)}</span>
                    </div>
                    {b.purpose && <div className="mt-2 text-muted small fst-italic">"{b.purpose}"</div>}

                    {b.received_at && (
                      <div className="mt-2 text-primary small border-top pt-2">
                        <i className="bi bi-box-seam me-1"></i> <strong>Received:</strong> {formatDate(b.received_at)}
                      </div>
                    )}
                    {b.returned_at && (
                      <div className="text-success small">
                        <i className="bi bi-check-circle me-1"></i> <strong>Returned:</strong> {formatDate(b.returned_at)}
                      </div>
                    )}
                  </div>
                </Card.Body>
                <Card.Footer className="bg-white border-top-0 pt-0 pb-3 px-3 d-flex flex-column gap-2">
                  {/* Status Actions */}
                  {b.status === 'accepted' && (
                    <Button variant="primary" size="sm" onClick={() => openImageModal(b.id, 'receive')}>
                      Receive Asset (Upload Photo)
                    </Button>
                  )}
                  {b.status === 'received' && (
                    <Button variant="success" size="sm" onClick={() => openImageModal(b.id, 'return')}>
                      Return Asset (Upload Photo)
                    </Button>
                  )}

                  {/* Cancel Action */}
                  {(!b.status || b.status === 'pending' || b.status === 'accepted') && (
                    <Button variant="outline-danger" size="sm" onClick={() => openCancelModal(b.id)}>
                      Cancel Booking
                    </Button>
                  )}
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Cancellation Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cancel Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Please select a reason for cancellation:</p>
          <Form>
            {cancellationOptions.map((option) => (
              <Form.Check
                key={option}
                type="radio"
                id={`reason-${option}`}
                label={option}
                name="cancelReason"
                value={option}
                checked={isOther ? option === 'Other' : cancelReason === option}
                onChange={(e) => {
                  if (e.target.value === 'Other') {
                    setIsOther(true);
                  } else {
                    setIsOther(false);
                    setCancelReason(e.target.value);
                  }
                }}
                className="mb-2"
              />
            ))}

            {isOther && (
              <Form.Group className="mt-3">
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Please specify your reason..."
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                />
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            Close
          </Button>
          <Button variant="danger" onClick={confirmCancel}>
            Confirm Cancellation
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Image Upload Modal */}
      <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {uploadAction === 'receive' ? 'Receive Asset - Upload Photo' : 'Return Asset - Upload Photo'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="formFile" className="mb-3">
            <Form.Label>Please upload a photo of the asset {uploadAction === 'receive' ? 'before taking it' : 'after usage'}</Form.Label>
            <Form.Control type="file" onChange={(e) => setSelectedFile(e.target.files[0])} accept="image/*" />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImageModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleImageSubmit} disabled={!selectedFile}>
            Submit & {uploadAction === 'receive' ? 'Receive' : 'Return'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
