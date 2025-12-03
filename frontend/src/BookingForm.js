import React, { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import { Form, Button, Card, Alert, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { authorizedFetch, getValidAccessToken, clearTokens, API_BASE } from './auth';

export default function BookingForm() {
  const [assets, setAssets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [purpose, setPurpose] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [confirmStage, setConfirmStage] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/v1/assets/`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setAssets(data);
        const map = new Map();
        data.forEach((a) => {
          if (a.location) map.set(a.location.id, a.location);
        });
        setLocations(Array.from(map.values()));
        setMsg('');
      })
      .catch(() => {
        setMsg('Failed to load assets. Please check if the server is running.');
      })
      .finally(() => setLoading(false));
  }, []);

  function toISO(dt) {
    if (!dt) return null;
    return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, -5);
  }

  function openBookingForm(assetId) {
    setSelectedAssetId(assetId);
    setConfirmStage(false);
    setMsg('');
    setStart(null);
    setEnd(null);
    setPurpose('');
    setFullName('');
    setMobile('');
    setEmail('');
    setAddress('');
    setSelectedLocationId('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!start || !end) {
      setMsg('Please select start and end date/time.');
      return;
    }
    if (!fullName || !mobile || !email) {
      setMsg('Please fill in all required fields.');
      return;
    }
    setConfirmStage(true);
  }

  async function confirmBooking() {
    const token = await getValidAccessToken();
    if (!token) {
      setMsg('Session expired. Please login again.');
      setConfirmStage(false);
      return;
    }

    setSubmitting(true);
    const body = {
      asset_id: Number(selectedAssetId),
      start_datetime: toISO(start),
      end_datetime: toISO(end),
      purpose: purpose || `Booking for ${fullName}`,
      contact_name: fullName,
      contact_email: email,
      contact_mobile: mobile,
      contact_address: address,
      contact_location_id: selectedLocationId ? Number(selectedLocationId) : null,
    };

    try {
      const res = await authorizedFetch(`${API_BASE}/api/v1/bookings/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        clearTokens();
        setMsg('Session expired. Please login again.');
        setConfirmStage(false);
        return;
      }

      if (res.ok) {
        alert('Booking confirmed successfully!');
        window.location.href = '/bookings';
      } else {
        const data = await res.json().catch(() => ({}));
        setMsg(data.detail || JSON.stringify(data) || 'Booking failed');
        setConfirmStage(false);
      }
    } catch (err) {
      if (err.message === 'AUTH_REQUIRED') {
        clearTokens();
        setMsg('Please login again.');
      } else {
        setMsg('Error: ' + err.message);
      }
      setConfirmStage(false);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedAsset = useMemo(
    () => assets.find((a) => a.id === Number(selectedAssetId)),
    [assets, selectedAssetId]
  );

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading assets...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {msg && (
        <Alert variant={msg.includes('success') ? 'success' : 'danger'} className="mb-4">
          {msg}
        </Alert>
      )}

      {!selectedAssetId && (
        <>
          <h2 className="mb-4">Select an Asset to Book</h2>
          <Row className="g-3">
            {assets.map((asset) => (
              <Col key={asset.id} xs={12} sm={6} md={4} lg={3}>
                <Card className="h-100 shadow-sm">
                  {asset.image_url ? (
                    <Card.Img
                      variant="top"
                      src={asset.image_url}
                      style={{ height: '140px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        height: '140px',
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
                    <Card.Title style={{ fontSize: '1rem' }}>{asset.name}</Card.Title>
                    {asset.location && (
                      <Badge bg="info" className="mb-2">
                        {asset.location.name}
                      </Badge>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-100 mt-2"
                      onClick={() => openBookingForm(asset.id)}
                    >
                      Book Now
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          {assets.length === 0 && <Alert variant="warning">No assets available.</Alert>}
        </>
      )}

      {selectedAssetId && !confirmStage && (
        <>
          <Button variant="outline-secondary" className="mb-4" onClick={() => setSelectedAssetId('')}>
            ← Back to Assets
          </Button>

          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Row>
                <Col md={4}>
                  {selectedAsset?.image_url ? (
                    <img
                      src={selectedAsset.image_url}
                      alt={selectedAsset.name}
                      style={{ width: '100%', borderRadius: '8px', maxHeight: '180px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        height: '180px',
                        backgroundColor: '#e9ecef',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#999',
                      }}
                    >
                      No Image
                    </div>
                  )}
                </Col>
                <Col md={8}>
                  <h4>{selectedAsset?.name}</h4>
                  {selectedAsset?.serial_number && <p>Serial: {selectedAsset.serial_number}</p>}
                  {selectedAsset?.location && <Badge bg="info">{selectedAsset.location.name}</Badge>}
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Booking Details</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <h6 className="text-muted mb-3">Select Date & Time</h6>
                <Row className="mb-4">
                  <Col md={6}>
                    <Form.Label>Start Date & Time *</Form.Label>
                    <DatePicker
                      selected={start}
                      onChange={setStart}
                      showTimeSelect
                      dateFormat="Pp"
                      className="form-control"
                      placeholderText="Select start"
                      minDate={new Date()}
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Label>End Date & Time *</Form.Label>
                    <DatePicker
                      selected={end}
                      onChange={setEnd}
                      showTimeSelect
                      dateFormat="Pp"
                      className="form-control"
                      placeholderText="Select end"
                      minDate={start || new Date()}
                    />
                  </Col>
                </Row>

                <h6 className="text-muted mb-3">Personal Details</h6>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name *</Form.Label>
                      <Form.Control
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your name"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mobile *</Form.Label>
                      <Form.Control
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="Enter mobile number"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email *</Form.Label>
                      <Form.Control
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Location</Form.Label>
                      <Form.Select
                        value={selectedLocationId}
                        onChange={(e) => setSelectedLocationId(e.target.value)}
                      >
                        <option value="">Select (optional)</option>
                        {locations.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter address (optional)"
                  />
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label>Purpose</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Why do you need this asset?"
                  />
                </Form.Group>
                <div className="d-flex gap-2">
                  <Button type="submit" variant="primary" size="lg">
                    Review Booking
                  </Button>
                  <Button variant="outline-secondary" size="lg" onClick={() => setSelectedAssetId('')}>
                    Cancel
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </>
      )}

      {confirmStage && (
        <Card className="shadow-sm">
          <Card.Header className="bg-success text-white">
            <h5 className="mb-0">Confirm Booking</h5>
          </Card.Header>
          <Card.Body>
            <Row className="mb-2">
              <Col sm={4}><strong>Asset:</strong></Col>
              <Col sm={8}>{selectedAsset?.name}</Col>
            </Row>
            <Row className="mb-2">
              <Col sm={4}><strong>Name:</strong></Col>
              <Col sm={8}>{fullName}</Col>
            </Row>
            <Row className="mb-2">
              <Col sm={4}><strong>Mobile:</strong></Col>
              <Col sm={8}>{mobile}</Col>
            </Row>
            <Row className="mb-2">
              <Col sm={4}><strong>Email:</strong></Col>
              <Col sm={8}>{email}</Col>
            </Row>
            <Row className="mb-2">
              <Col sm={4}><strong>Start:</strong></Col>
              <Col sm={8}>{start?.toLocaleString()}</Col>
            </Row>
            <Row className="mb-2">
              <Col sm={4}><strong>End:</strong></Col>
              <Col sm={8}>{end?.toLocaleString()}</Col>
            </Row>
            <Row className="mb-4">
              <Col sm={4}><strong>Purpose:</strong></Col>
              <Col sm={8}>{purpose || '—'}</Col>
            </Row>
            <div className="d-flex gap-2">
              <Button variant="success" size="lg" onClick={confirmBooking} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Confirm Booking'}
              </Button>
              <Button variant="outline-secondary" size="lg" onClick={() => setConfirmStage(false)} disabled={submitting}>
                Go Back
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
