import React, { useState, useEffect } from 'react';
import * as serviceApi from '../services/servicesServices';
import ServiceCard from '../components/ServiceCard';
import ServiceForm from '../components/ServiceForm';
import FormModal from '../components/FormModal';
import { useUser } from '../context/useUser';
import { Wrench, SlidersHorizontal, Search, MapPin, Plus } from 'lucide-react';

const HomeServices = ({ initialFilters, onViewService }) => {
  const { currentUser } = useUser();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState(initialFilters?.query || '');
  const [locationQuery, setLocationQuery] = useState(initialFilters?.location || '');
  const [showAddForm, setShowAddForm] = useState(false);
  const canAddService = currentUser && currentUser.role !== 'company';
  const hasActiveFilters = Boolean(searchQuery || locationQuery);

  useEffect(() => {
    if (initialFilters) {
      setSearchQuery(initialFilters.query || '');
      setLocationQuery(initialFilters.location || '');
    }
  }, [initialFilters]);

  const loadData = () => {
    setLoading(true);
    
    const params = {};
    if (locationQuery) params.location = locationQuery;

    serviceApi.getAll(params)
      .then((svcsData) => {
        setServices(svcsData);
      })
      .catch(err => console.error("Error loading service data:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [locationQuery]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setLocationQuery('');
  };

  const filteredServices = services.filter(svc => {
    const matchesSearch = 
      svc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      svc.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="container fade-in-content mb-5">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="fw-bold mb-1 text-dark d-flex align-items-center">
            <Wrench className="text-secondary me-2" size={32} />
            Browse Services
          </h1>
          <p className="text-muted mb-0">Hire top-rated home care and repair professionals in your neighborhood.</p>
        </div>
        {canAddService && (
          <button onClick={() => setShowAddForm(true)} className="btn btn-premium d-flex align-items-center">
            <Plus size={18} className="me-2" />
            Add Service
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
                  placeholder="e.g. Electrician"
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
                  placeholder="Search service area"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                />
              </div>
            </div>

          </div>
        </div>

        
        <div className="col-lg-9">
          {loading ? (
            <div className="text-center py-5">
              <div className="loader-spinner mb-3"></div>
              <p className="text-muted fw-semibold">Fetching services...</p>
            </div>
          ) : (
            <>
              
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                  Showing <strong className="text-dark">{filteredServices.length}</strong> services
                </span>
              </div>

              
              <div className="row g-4">
                {filteredServices.map(service => (
                  <div className="col-12" key={service.homeServiceId}>
                    <ServiceCard service={service} onView={onViewService} />
                  </div>
                ))}

                
                {filteredServices.length === 0 && (
                  <div className="col-12 text-center py-5 px-4 rounded-4 bg-white shadow-sm border-0 my-4">
                    <Wrench className="text-muted mx-auto mb-3" size={48} />
                    <h5 className="fw-bold">No Services Match Your Search</h5>
                    <p className="text-muted mx-auto mb-3" style={{ maxWidth: '400px' }}>
                      Try adjusting your keywords, broadening your location text, or clearing filters.
                    </p>
                    {hasActiveFilters && (
                      <button onClick={handleResetFilters} className="btn btn-premium px-4" style={{ background: 'var(--grad-sunset)' }}>
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
          <ServiceForm
            onSave={async (serviceData) => {
              await serviceApi.create(serviceData);
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

export default HomeServices;
