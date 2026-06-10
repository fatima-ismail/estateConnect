import React, { useState, useEffect } from 'react';
import * as propertyApi from '../services/propertyServices';
import PropertyCard from '../components/PropertyCard';
import PropertyForm from '../components/PropertyForm';
import FormModal from '../components/FormModal';
import { useUser } from '../context/useUser';
import { Building, SlidersHorizontal, Search, MapPin, Plus } from 'lucide-react';

const Properties = ({ initialFilters, onViewProperty }) => {
  const { currentUser } = useUser();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState(initialFilters?.query || '');
  const [locationQuery, setLocationQuery] = useState(initialFilters?.location || '');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const canAddProperty = currentUser && currentUser.role !== 'company';
  const hasActiveFilters = Boolean(
    searchQuery ||
    locationQuery ||
    selectedType ||
    selectedStatus ||
    minPrice ||
    maxPrice
  );

  useEffect(() => {
    if (initialFilters) {
      setSearchQuery(initialFilters.query || '');
      setLocationQuery(initialFilters.location || '');
    }
  }, [initialFilters]);

  const loadData = () => {
    setLoading(true);

    const params = {};
    if (selectedType) params.type = selectedType;
    if (selectedStatus) params.status = selectedStatus;

    propertyApi.getAll(params)
      .then((propsData) => {
        setProperties(propsData);
      })
      .catch(err => console.error("Error loading property data:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [selectedType, selectedStatus]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setLocationQuery('');
    setSelectedType('');
    setSelectedStatus('');
    setMinPrice('');
    setMaxPrice('');
  };

  const filteredProperties = properties.filter(prop => {
    const matchesSearch =
      prop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation =
      prop.location.toLowerCase().includes(locationQuery.toLowerCase());

    const matchesMinPrice = minPrice === '' || prop.price >= parseFloat(minPrice);
    const matchesMaxPrice = maxPrice === '' || prop.price <= parseFloat(maxPrice);

    return matchesSearch && matchesLocation && matchesMinPrice && matchesMaxPrice;
  });

  const propertyTypes = ['Apartment', 'Villa', 'Land', 'Office', 'Shop', 'House','Studio'];
  const statuses = ['For Sale', 'For Rent', 'Sold', 'Rented'];

  return (
    <div className="container fade-in-content mb-5">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="fw-bold mb-1 text-dark d-flex align-items-center">
            <Building className="text-primary me-2" size={32} />
            Browse Properties
          </h1>
          <p className="text-muted mb-0">Explore beautiful options available for rent or purchase.</p>
        </div>
        {canAddProperty && (
          <button onClick={() => setShowAddForm(true)} className="btn btn-premium d-flex align-items-center">
            <Plus size={18} className="me-2" />
            Add Property
          </button>
        )}
      </div>

      <div className="row g-4">
        <div className="col-lg-3">
          <div className="card shadow-sm border-0 p-4 rounded-4 bg-white sticky-lg-top" style={{ top: '90px', zIndex: 5 }}>
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <span className="fw-bold fs-5 text-dark d-flex align-items-center">
                <SlidersHorizontal className="text-muted me-2" size={18} />
                Filters
              </span>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="btn btn-sm btn-link text-muted text-decoration-none p-0"
                  style={{ fontSize: '0.85rem' }}
                >
                  Reset All
                </button>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold text-muted small">Keyword Search</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted"><Search size={14} /></span>
                <input
                  type="text"
                  className="form-control border-start-0 bg-light"
                  placeholder="e.g. Penthouse"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold text-muted small">Location</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted"><MapPin size={14} /></span>
                <input
                  type="text"
                  className="form-control border-start-0 bg-light"
                  placeholder="City or state"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold text-muted small">Property Type</label>
              <select
                className="form-select bg-light"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">All Types</option>
                {propertyTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold text-muted small">Status</label>
              <select
                className="form-select bg-light"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                {statuses.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="mb-2">
              <label className="form-label fw-semibold text-muted small">Price Range ($)</label>
              <div className="row g-2">
                <div className="col-6">
                  <input
                    type="number"
                    className="form-control bg-light text-center"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <input
                    type="number"
                    className="form-control bg-light text-center"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-9">
          {loading ? (
            <div className="text-center py-5">
              <div className="loader-spinner mb-3"></div>
              <p className="text-muted fw-semibold">Fetching property listings...</p>
            </div>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                  Showing <strong className="text-dark">{filteredProperties.length}</strong> properties
                </span>
              </div>

              <div className="row g-4">
                {filteredProperties.map(property => (
                  <div className="col-12" key={property.propertyId}>
                    <PropertyCard property={property} onView={onViewProperty} />
                  </div>
                ))}

                {filteredProperties.length === 0 && (
                  <div className="col-12 text-center py-5 px-4 rounded-4 bg-white shadow-sm border-0 my-4">
                    <Building className="text-muted mx-auto mb-3" size={48} />
                    <h5 className="fw-bold">No Properties Match Your Search</h5>
                    <p className="text-muted mx-auto mb-3" style={{ maxWidth: '400px' }}>
                      Try adjusting your keywords, expanding your price bounds, or clearing filters.
                    </p>
                    {hasActiveFilters && (
                      <button onClick={handleResetFilters} className="btn btn-premium px-4">
                        Clear All Filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      {showAddForm && (
        <FormModal onClose={() => setShowAddForm(false)}>
          <PropertyForm
            onSave={async (propertyData) => {
              await propertyApi.create(propertyData);
              setShowAddForm(false);
              loadData();
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </FormModal>
      )}
    </div>
  );
};

export default Properties;
