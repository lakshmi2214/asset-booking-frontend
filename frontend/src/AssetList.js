import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Container, Row, Col, Badge, Dropdown, DropdownButton } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { API_BASE, isStandaloneMode, setStandaloneMode } from './auth';
import { MOCK_ASSETS, MOCK_CATEGORIES } from './mockData';

export default function AssetList() {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);

  // null  = show all assets
  // {type:'category', id} = main category selected
  // {type:'subcategory', id, parentId} = subcategory selected
  const [filter, setFilter] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      // If in standalone mode, use mock data immediately
      if (isStandaloneMode()) {
        if (isMounted) {
          setAssets(Array.isArray(MOCK_ASSETS) ? MOCK_ASSETS : []);
          setCategories(Array.isArray(MOCK_CATEGORIES) ? MOCK_CATEGORIES : []);
        }
        return;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds for cold starts

        let assetsRes, categoriesRes;
        try {
          [assetsRes, categoriesRes] = await Promise.all([
            fetch(`${API_BASE}/api/v1/assets/`, {
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal
            }),
            fetch(`${API_BASE}/api/v1/categories/`, {
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal
            })
          ]);
        } catch (fetchErr) {
          console.error("Network fetch failed:", fetchErr);
          throw fetchErr;
        }

        clearTimeout(timeoutId);

        if (isMounted) {
          if (assetsRes && assetsRes.ok) {
            const assetsData = await assetsRes.json();
            if (assetsData && assetsData.length > 0) {
              setAssets(assetsData);
            } else {
              setAssets(MOCK_ASSETS);
            }
          } else {
            setAssets(MOCK_ASSETS);
          }
          if (categoriesRes && categoriesRes.ok) {
            const categoriesData = await categoriesRes.json();
            if (categoriesData && categoriesData.length > 0) {
              setCategories(categoriesData);
            } else {
              setCategories(MOCK_CATEGORIES);
            }
          } else {
            setCategories(MOCK_CATEGORIES);
          }
        }
      } catch (err) {
        console.error("AssetList fetch error, falling back to mock data:", err);
        if (err.message === 'Failed to fetch' || err.name === 'AbortError') {
          console.warn("Backend connection failed, switching to standalone mode.");
          setStandaloneMode(true);
        }
        if (isMounted) {
          setAssets(MOCK_ASSETS);
          setCategories(MOCK_CATEGORIES);
        }
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, []);


  const filteredAssets = useMemo(() => {
    if (!Array.isArray(assets)) return [];
    if (!filter) return assets;

    if (filter.type === 'category') {
      return assets.filter(a => {
        if (!a) return false;
        const catMatch = a.category && (
          a.category.id === filter.id ||
          String(a.category.id) === String(filter.id)
        );

        const nameMatch = a.category && Array.isArray(categories) && (
          a.category.name === (categories.find(c => c && c.id === filter.id) || {}).name
        );
        return catMatch || nameMatch;
      });
    }

    if (filter.type === 'subcategory') {
      return assets.filter(a => {
        if (!a) return false;
        const subMatch = a.subcategory && (
          a.subcategory.id === filter.id ||
          String(a.subcategory.id) === String(filter.id)
        );
        const nameMatch = a.subcategory && (() => {
          if (!Array.isArray(categories)) return false;
          const parentCat = categories.find(c => c && c.id === filter.parentId);
          const sub = parentCat && parentCat.subcategories &&
            parentCat.subcategories.find(s => s && s.id === filter.id);
          return sub && a.subcategory.name === sub.name;
        })();
        return subMatch || nameMatch;
      });
    }

    return assets;
  }, [assets, categories, filter]);


  const isCategoryActive = (catId) =>
    filter && filter.type === 'category' && filter.id === catId;

  const isSubcategoryActive = (subId) =>
    filter && filter.type === 'subcategory' && filter.id === subId;

  const isDropdownActive = (cat) =>
    isCategoryActive(cat.id) ||
    (cat.subcategories && cat.subcategories.some(s => isSubcategoryActive(s.id)));


  const activeLabel = useMemo(() => {
    if (!filter) return null;
    if (filter.type === 'category') {
      const cat = categories.find(c => c.id === filter.id);
      return cat ? `All ${cat.name}` : 'Category';
    }
    if (filter.type === 'subcategory') {
      const parent = categories.find(c => c.id === filter.parentId);
      const sub = parent && parent.subcategories &&
        parent.subcategories.find(s => s.id === filter.id);
      return sub ? `${parent.name} › ${sub.name}` : 'Subcategory';
    }
    return null;
  }, [filter, categories]);


  return (
    <Container className="mt-4">
      <h2 className="mb-4">Available Assets</h2>

      {/* ── Filter Bar ── */}
      <div
        className="d-flex flex-wrap gap-2 mb-5 align-items-center p-3 glass-morphism rounded-4 shadow-sm border"
        style={{ position: 'relative', zIndex: 1000 }}
      >
        {/* All Assets */}
        <Button
          variant="light"
          className={`filter-btn ${!filter ? 'filter-btn-active' : ''}`}
          onClick={() => setFilter(null)}
        >
          All Assets
        </Button>

        <div className="vr mx-1 opacity-25" />

        {/* Category dropdowns */}
        {categories.map(cat => {
          const active = isDropdownActive(cat);
          return (
            <DropdownButton
              key={cat.id}
              variant="light"
              title={cat.name}
              className={`filter-dropdown ${active ? 'filter-dropdown-active' : ''}`}
              size="sm"
              renderMenuOnMount={true}
              toggleClassName={`filter-btn ${active ? 'filter-btn-active' : ''}`}
              id={`dropdown-cat-${cat.id}`}
            >
              {/* "All <Category>" option */}
              <Dropdown.Item
                active={isCategoryActive(cat.id)}
                onClick={() => setFilter({ type: 'category', id: cat.id })}
              >
                All {cat.name}
              </Dropdown.Item>

              {/* Subcategories */}
              {cat.subcategories && cat.subcategories.length > 0 && (
                <>
                  <Dropdown.Divider />
                  {cat.subcategories.map(sub => (
                    <Dropdown.Item
                      key={sub.id}
                      active={isSubcategoryActive(sub.id)}
                      onClick={() =>
                        setFilter({ type: 'subcategory', id: sub.id, parentId: cat.id })
                      }
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

      { }
      {activeLabel && (
        <div className="mb-4 d-flex align-items-center gap-2">
          <span className="text-muted" style={{ fontSize: '0.9rem' }}>Filtering by:</span>
          <Badge
            style={{
              background: 'linear-gradient(135deg, #6366f1, #f43f5e)',
              fontSize: '0.85rem',
              padding: '0.45em 0.9em',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
            onClick={() => setFilter(null)}
            title="Click to clear filter"
          >
            {activeLabel}
            <span style={{ fontWeight: 400, opacity: 0.8 }}>✕</span>
          </Badge>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            ({filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''} found)
          </span>
        </div>
      )}

      {/* ── Asset Grid ── */}
      <Row className="g-4">
        {filteredAssets.map(a => (
          <Col key={a.id} xs={12} sm={12} md={6} lg={4}>
            <Card className="h-100 asset-card">
              <div className="asset-img-container">
                {a.image_url ? (
                  <Card.Img
                    variant="top"
                    src={a.image_url}
                    className="asset-card-img"
                    alt={a.name}
                  />
                ) : (
                  <div style={{
                    height: '100%',
                    backgroundColor: '#f1f3f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ color: '#adb5bd', fontWeight: 500 }}>No Image Available</span>
                  </div>
                )}
              </div>

              <Card.Body className="asset-card-body">
                <Card.Title className="asset-card-title">{a.name}</Card.Title>

                <div className="d-flex align-items-center mb-3 flex-wrap gap-2">
                  {/* Category tag */}
                  {a.category && (
                    <Badge bg="secondary" style={{ opacity: 0.85, fontSize: '0.75rem' }}>
                      {a.category.name}
                    </Badge>
                  )}
                  {/* Subcategory tag */}
                  {a.subcategory && (
                    <Badge
                      bg="light"
                      text="dark"
                      className="border"
                      style={{ fontSize: '0.75rem' }}
                    >
                      {a.subcategory.name}
                    </Badge>
                  )}
                </div>

                <div className="d-flex align-items-center mb-2 flex-wrap gap-2">
                  {a.location && (
                    <Badge bg="light" text="dark" className="border">
                      <i className="bi bi-geo-alt-fill text-danger me-1" /> {a.location.name}
                    </Badge>
                  )}
                  <Badge
                    bg={
                      a.status?.includes('Available') ? 'success'
                        : a.status === 'Pending' ? 'warning' : 'danger'
                    }
                    className="asset-status-badge"
                  >
                    {a.status || (a.available ? 'Available' : 'Out of Stock')}
                  </Badge>
                </div>
              </Card.Body>

              <Card.Footer className="bg-white border-top-0 pt-0 pb-3 px-3">
                <Link to={`/assets/${a.id}`}>
                  <Button variant="primary" className="w-100">View Details</Button>
                </Link>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Empty state ── */}
      {filteredAssets.length === 0 && (
        <div className="text-center mt-5 py-5">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <p className="text-muted fs-5">No assets found for the selected category.</p>
          <Button variant="outline-primary" className="mt-2" onClick={() => setFilter(null)}>
            Show All Assets
          </Button>
        </div>
      )}
    </Container>
  );
}
