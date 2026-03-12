import React, { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import { Form, Button, Card, Alert, Row, Col, Badge, Modal, Dropdown, DropdownButton } from 'react-bootstrap';
import 'react-datepicker/dist/react-datepicker.css';
import { authorizedFetch, getValidAccessToken, clearTokens, API_BASE, isStandaloneMode } from './auth';

import { MOCK_ASSETS, MOCK_CATEGORIES } from './mockData';

export default function AssetBooking() {
  const [assets, setAssets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [purpose, setPurpose] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');

  const [confirmStage, setConfirmStage] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadInitialData = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const [assetsRes, categoriesRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/assets/`, {
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal
          }),
          fetch(`${API_BASE}/api/v1/categories/`, {
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal
          }).catch(() => ({ ok: false }))
        ]);

        clearTimeout(timeoutId);

        if (isMounted) {
          if (assetsRes && assetsRes.ok) {
            const assetsData = await assetsRes.json();
            const safeAssetsData = Array.isArray(assetsData) && assetsData.length > 0 ? assetsData : [];

            setAssets(safeAssetsData);
            const map = new Map();
            safeAssetsData.forEach((a) => {
              if (a && a.location) map.set(a.location.id, a.location);
            });
            setLocations(Array.from(map.values()));
          } else {
            setMsg('Error loading assets from backend.');
            setAssets([]);
            setLocations([]);
          }

          if (categoriesRes && categoriesRes.ok) {
            const categoriesData = await categoriesRes.json();
            setCategories(Array.isArray(categoriesData) && categoriesData.length > 0 ? categoriesData : []);
          } else {
            setCategories([]);
          }
        }
      } catch (err) {
        console.error("Fetch error:", err);
        if (isMounted) {
          setMsg('Network error. Failed to load data.');
          setAssets([]);
          setLocations([]);
          setCategories([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialData();
    return () => { isMounted = false; };
  }, []);

  function toISO(dt) {
    if (!dt) return null;
    return dt.toISOString();
  }

  function openBookingForm(assetId) {
    setSelectedAssetId(assetId);
    setQuantity(1);
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

  function handleInitialSubmit(e) {
    e.preventDefault();
    if (!selectedAssetId) {
      setMsg('Please select an asset to book.');
      return;
    }
    if (!start || !end) {
      setMsg('Please select both start and end date/time.');
      return;
    }
    if (!fullName || !mobile || !email) {
      setMsg('Please fill in all personal details.');
      return;
    }
    setConfirmStage(true);
  }

  async function acceptBooking() {
    const token = await getValidAccessToken();
    if (!token) {
      setMsg('Session expired. Please login again.');
      setConfirmStage(false);
      return;
    }

    const asset = assets.find((a) => a.id === Number(selectedAssetId));

    const body = {
      asset_id: asset.id,
      quantity: Number(quantity),
      start_datetime: toISO(start),
      end_datetime: toISO(end),
      purpose: purpose || `Booking for ${fullName}`,
      contact_name: fullName,
      contact_email: email,
      contact_mobile: mobile,
      contact_address: address,
      contact_location_id: selectedLocationId ? Number(selectedLocationId) : null,
    };

    let res;
    try {
      res = await authorizedFetch(`${API_BASE}/api/v1/bookings/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      if (err.message === 'AUTH_REQUIRED') {
        clearTokens();
        setMsg('Session expired. Please login again.');
        setConfirmStage(false);
        return;
      }
      setMsg('Error: ' + err.message);
      setConfirmStage(false);
      return;
    }

    if (res.status === 401) {
      clearTokens();
      setMsg('Session expired. Please login again.');
      setConfirmStage(false);
      return;
    }

    if (res.ok) {
      const data = await res.json();
      setMsg('Booking created successfully (ID: ' + data.id + ')');
      setShowSuccessModal(true);
    } else {
      let t = {};
      try {
        t = await res.json();
      } catch (e) { }

      if (res.status === 400) {
        // Check if it's an overlap error or validation error
        if (typeof t === 'object') {
          if (JSON.stringify(t).includes('overlap')) {
            setErrorMessage("Book after 1 hour. This period of time is already booked.");
            setShowErrorModal(true);
            setConfirmStage(false);
            return;
          }
          // Flatten other validation errors
          const errorMsg = Object.entries(t).map(([k, v]) => `${k}: ${v}`).join(', ');
          setMsg('Error: ' + errorMsg);
          setConfirmStage(false);
          return;
        }
      }

      setMsg('Error: ' + (t.detail || JSON.stringify(t)) + (Object.keys(t).length === 0 ? ` (Status: ${res.status})` : ''));
      setConfirmStage(false);
    }
  }

  function rejectBooking() {
    setConfirmStage(false);
  }

  const summary = useMemo(() => {
    const loc = Array.isArray(locations) ? locations.find((l) => l && l.id === Number(selectedLocationId)) : null;
    const asset = Array.isArray(assets) ? assets.find((a) => a && a.id === Number(selectedAssetId)) : null;
    return {
      asset: asset ? asset.name : '—',
      fullName,
      mobile,
      email,
      address,
      location: loc ? loc.name : '—',
      start,
      end,
      purpose,
      quantity,
    };
  }, [
    assets,
    fullName,
    mobile,
    email,
    address,
    selectedLocationId,
    locations,
    start,
    end,
    purpose,
    selectedAssetId,
    quantity
  ]);

  const filteredAssets = useMemo(() => {
    if (!Array.isArray(assets)) return [];
    if (!selectedCategoryId) return assets;

    // Check if category is a parent category or a subcategory
    const isParent = Array.isArray(categories) && categories.some(cat => cat && cat.id === selectedCategoryId);

    if (isParent) {
      return assets.filter(a => a && a.category && a.category.id === selectedCategoryId);
    } else {
      // Check if it's a subcategory ID
      return assets.filter(a => a && a.subcategory && a.subcategory.id === selectedCategoryId);
    }
  }, [assets, selectedCategoryId, categories]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading assets...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '20px auto', fontFamily: 'Arial, sans-serif' }}>
      {msg && (
        <Alert variant={msg.includes('success') ? 'success' : msg.includes('Error') || msg.includes('Failed') || msg.includes('expired') ? 'danger' : 'info'}>
          {msg}
        </Alert>
      )}

      {!selectedAssetId && (
        <>
          <h2 className="mb-4">Available Assets for Booking</h2>

          {/* Category Filter */}
          <div className="d-flex flex-wrap gap-3 mb-5 align-items-center p-3 glass-morphism rounded-4 shadow-sm border" style={{ position: 'relative', zIndex: 1000 }}>
            <Button
              variant="light"
              className={`filter-btn ${!selectedCategoryId ? 'filter-btn-active' : ''}`}
              onClick={() => setSelectedCategoryId(null)}
            >
              All Assets
            </Button>

            <div className="vr mx-1 opacity-25"></div>

            {categories.map(cat => {
              const isAnySubSelected = cat.subcategories && cat.subcategories.some(sub => sub.id === selectedCategoryId);
              const isParentSelected = selectedCategoryId === cat.id;
              const isActive = isAnySubSelected || isParentSelected;

              return (
                <DropdownButton
                  key={cat.id}
                  variant="light"
                  title={cat.name}
                  className={`filter-dropdown ${isActive ? 'filter-dropdown-active' : ''}`}
                  size="sm"
                  onSelect={(ek) => setSelectedCategoryId(Number(ek))}
                  renderMenuOnMount={true}
                  toggleClassName={`filter-btn ${isActive ? 'filter-btn-active' : ''}`}
                >
                  <Dropdown.Item eventKey={cat.id} active={selectedCategoryId === cat.id}>
                    All {cat.name}
                  </Dropdown.Item>
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <>
                      <Dropdown.Divider />
                      {cat.subcategories.map(sub => (
                        <Dropdown.Item
                          key={sub.id}
                          eventKey={sub.id}
                          active={selectedCategoryId === sub.id}
                        >
                          {sub.name}
                        </Dropdown.Item>
                      ))}
                    </>
                  )}
                </DropdownButton>
              );
            })}
          </div>

          <Row className="g-3">
            {filteredAssets.map((asset) => (
              <Col key={asset.id} xs={12} sm={12} md={6} lg={4}>
                <Card className="h-100 asset-card">
                  <div className="asset-img-container">
                    {asset.image_url ? (
                      <Card.Img
                        variant="top"
                        src={asset.image_url}
                        className="asset-card-img"
                        alt={asset.name}
                      />
                    ) : (
                      <div style={{ height: '100%', backgroundColor: '#f1f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#adb5bd' }}>No Image</span>
                      </div>
                    )}
                  </div>
                  <Card.Body className="asset-card-body">
                    <Card.Title className="asset-card-title">{asset.name}</Card.Title>
                    {/* Hidden serial number to focus on image */}
                    <div className="d-flex align-items-center mb-3 flex-wrap gap-2">
                      {asset.location && (
                        <Badge bg="light" text="dark" className="border">
                          {asset.location.name}
                        </Badge>
                      )}
                      <Badge
                        bg={
                          asset.status?.includes('Available') ? 'success' :
                            asset.status === 'Pending' ? 'warning' : 'danger'
                        }
                        className="asset-status-badge"
                      >
                        {asset.status || (asset.available ? 'Available' : 'Out of Stock')}
                      </Badge>
                    </div>

                    <Button
                      variant="primary"
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
          {filteredAssets.length === 0 && (
            <Alert variant="info" className="mt-3">
              No assets found in this category.
            </Alert>
          )}
        </>
      )}

      {selectedAssetId && !confirmStage && (
        <>
          <div className="mb-4">
            <Button
              variant="outline-secondary"
              onClick={() => setSelectedAssetId('')}
              className="mb-3"
            >
              ← Back to Assets
            </Button>
          </div>

          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Row>
                <Col md={4}>
                  {assets.find((a) => a.id === Number(selectedAssetId))?.image_url ? (
                    <Card.Img
                      src={assets.find((a) => a.id === Number(selectedAssetId))?.image_url}
                      alt="Asset"
                      style={{ maxHeight: '200px', objectFit: 'cover', borderRadius: '6px' }}
                    />
                  ) : (
                    <div style={{ height: '200px', backgroundColor: '#e9ecef', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                      No Image
                    </div>
                  )}
                </Col>
                <Col md={8}>
                  <div className="d-flex justify-content-between align-items-start">
                    <h4>{assets.find((a) => a.id === Number(selectedAssetId))?.name}</h4>
                    <Badge bg="info" style={{ fontSize: '0.9rem' }}>
                      {assets.find((a) => a.id === Number(selectedAssetId))?.status}
                    </Badge>
                  </div>
                  {assets.find((a) => a.id === Number(selectedAssetId))?.serial_number && (
                    <p className="mb-1"><strong>Serial:</strong> {assets.find((a) => a.id === Number(selectedAssetId))?.serial_number}</p>
                  )}
                  {assets.find((a) => a.id === Number(selectedAssetId))?.location && (
                    <p className="mb-1"><strong>Location:</strong> {assets.find((a) => a.id === Number(selectedAssetId))?.location.name}</p>
                  )}
                  {assets.find((a) => a.id === Number(selectedAssetId))?.description && (
                    <p className="mt-2 text-muted small">{assets.find((a) => a.id === Number(selectedAssetId))?.description}</p>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Book This Asset</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleInitialSubmit}>
                <div className="mb-4">
                  <h6 className="mb-3 text-muted">Asset Quantity</h6>
                  <Row>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label><strong>How many units? *</strong></Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          max={assets.find((a) => a.id === Number(selectedAssetId))?.total_quantity || 1}
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          required
                        />
                        <Form.Text className="text-muted">
                          Available total: {assets.find((a) => a.id === Number(selectedAssetId))?.total_quantity || 1} units
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                <h6 className="mb-3 text-muted">Booking Time</h6>
                <Row className="mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label><strong>Start Date & Time *</strong></Form.Label>
                      <DatePicker
                        selected={start}
                        onChange={(date) => setStart(date)}
                        showTimeSelect
                        dateFormat="Pp"
                        placeholderText="Select start date/time"
                        className="form-control"
                        minDate={new Date()}
                        filterTime={(time) => {
                          const currentDate = new Date();
                          const selectedDate = new Date(time);
                          return currentDate.getTime() < selectedDate.getTime();
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label><strong>End Date & Time *</strong></Form.Label>
                      <DatePicker
                        selected={end}
                        onChange={(date) => setEnd(date)}
                        showTimeSelect
                        dateFormat="Pp"
                        placeholderText="Select end date/time"
                        className="form-control"
                        minDate={start || new Date()}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <h6 className="mb-3 text-muted">Personal Details</h6>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label><strong>Full Name *</strong></Form.Label>
                      <Form.Control
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label><strong>Mobile Number *</strong></Form.Label>
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
                      <Form.Label><strong>Email *</strong></Form.Label>
                      <Form.Control
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email address"
                        type="email"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label><strong>Location</strong></Form.Label>
                      <Form.Select
                        value={selectedLocationId}
                        onChange={(e) => setSelectedLocationId(e.target.value)}
                      >
                        <option value="">Select location (optional)</option>
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
                  <Form.Label><strong>Address</strong></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your address (optional)"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label><strong>Purpose of Booking</strong></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Describe the purpose of your booking"
                  />
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button type="submit" variant="primary" size="lg">
                    Review Booking
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    size="lg"
                    onClick={() => setSelectedAssetId('')}
                  >
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
            <h5 className="mb-0">Confirm Your Booking</h5>
          </Card.Header>
          <Card.Body>
            <Row className="mb-3">
              <Col sm={4}><strong>Asset:</strong></Col>
              <Col sm={8}>{summary.asset}</Col>
            </Row>
            <Row className="mb-3">
              <Col sm={4}><strong>Quantity:</strong></Col>
              <Col sm={8}><Badge bg="primary">{summary.quantity} Unit(s)</Badge></Col>
            </Row>
            <Row className="mb-3">
              <Col sm={4}><strong>Name:</strong></Col>
              <Col sm={8}>{summary.fullName || '—'}</Col>
            </Row>
            <Row className="mb-3">
              <Col sm={4}><strong>Mobile:</strong></Col>
              <Col sm={8}>{summary.mobile || '—'}</Col>
            </Row>
            <Row className="mb-3">
              <Col sm={4}><strong>Email:</strong></Col>
              <Col sm={8}>{summary.email || '—'}</Col>
            </Row>
            <Row className="mb-3">
              <Col sm={4}><strong>Address:</strong></Col>
              <Col sm={8}>{summary.address || '—'}</Col>
            </Row>
            <Row className="mb-3">
              <Col sm={4}><strong>Location:</strong></Col>
              <Col sm={8}>{summary.location}</Col>
            </Row>
            <Row className="mb-3">
              <Col sm={4}><strong>Start:</strong></Col>
              <Col sm={8}>{summary.start ? summary.start.toLocaleString() : '—'}</Col>
            </Row>
            <Row className="mb-3">
              <Col sm={4}><strong>End:</strong></Col>
              <Col sm={8}>{summary.end ? summary.end.toLocaleString() : '—'}</Col>
            </Row>
            <Row className="mb-4">
              <Col sm={4}><strong>Purpose:</strong></Col>
              <Col sm={8}>{summary.purpose || '—'}</Col>
            </Row>
            <div className="d-flex gap-2">
              <Button variant="success" size="lg" onClick={acceptBooking}>
                Confirm Booking
              </Button>
              <Button variant="outline-secondary" size="lg" onClick={rejectBooking}>
                Go Back
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}
      {showSuccessModal && (
        <Modal show={showSuccessModal} centered size="sm" backdrop="static" keyboard={false}>
          <Modal.Body className="text-center p-4">
            <style>
              {`
                @keyframes popIn {
                  0% { transform: scale(0.5); opacity: 0; }
                  100% { transform: scale(1); opacity: 1; }
                }
                .emoji-pop {
                  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
              `}
            </style>
            <div className="emoji-pop" style={{ fontSize: '3.5rem', marginBottom: '15px' }}>📸</div>
            <h4 className="mb-2" style={{ fontWeight: 'bold', color: '#198754' }}>Confirmed!</h4>
            <p className="text-muted small mb-4">Your asset has been reserved.</p>
            <div className="emoji-pop" style={{ fontSize: '1.5rem', marginBottom: '20px', animationDelay: '0.2s' }}>✨ 🎥 ✨</div>
            <Button
              variant="success"
              size="sm"
              className="w-100 rounded-pill"
              style={{ fontWeight: '600' }}
              onClick={() => {
                setShowSuccessModal(false);
                setSelectedAssetId('');
                setPurpose('');
                setFullName('');
                setMobile('');
                setEmail('');
                setAddress('');
                setSelectedLocationId('');
                setStart(null);
                setEnd(null);
                setConfirmStage(false);
                window.location.href = '#/bookings';
              }}
            >
              OK, Great!
            </Button>
          </Modal.Body>
        </Modal>
      )}

      {/* Error Modal */}
      <Modal show={showErrorModal} onHide={() => setShowErrorModal(false)} centered backdrop="static" keyboard={false}>
        <Modal.Header className="bg-danger text-white">
          <Modal.Title>Booking Failed</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-4">
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>⚠️</div>
          <h5 className="mb-3" style={{ fontWeight: 'bold' }}>Conflict Detected</h5>
          <p className="text-dark" style={{ fontSize: '1.1rem' }}>{errorMessage}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => setShowErrorModal(false)}>
            Understood
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
