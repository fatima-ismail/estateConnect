import React, { useState, useEffect } from 'react';
import * as propertyApi from '../services/propertyServices';
import { BedDouble, Bath, Maximize, MapPin, Tag, User, Calendar, Mail, Phone, ChevronLeft, ShieldCheck, Building2, Home } from 'lucide-react';

const PropertyDetail = ({ propertyId, onBack }) => {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!propertyId) return;
    setLoading(true);
    propertyApi.getById(propertyId)
      .then(data => {
        setProperty(data);
      })
      .catch(err => {
        console.error("Error fetching property detail:", err);
        setError("Failed to load property details. It might have been deleted.");
      })
      .finally(() => setLoading(false));
  }, [propertyId]);

  const formatPrice = (price, status) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
    return status === 'For Rent' || status === 'Rented' ? `${formatted}/mo` : formatted;
  };

  const defaultImage = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80";

  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="loader-spinner mb-3"></div>
        <p className="text-muted fw-semibold">Loading property details...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger py-4 rounded-4" role="alert">
          <p className="mb-3 fw-bold">{error || "Property not found."}</p>
          <button onClick={onBack} className="btn btn-outline-danger d-inline-flex align-items-center">
            <ChevronLeft size={16} className="me-1" /> Back to Properties
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container fade-in-content mb-5">
      
      <button 
        onClick={onBack} 
        className="btn btn-light border d-inline-flex align-items-center mb-4 px-3 py-2 rounded-3 hover-bg-light"
      >
        <ChevronLeft size={18} className="me-1 text-muted" />
        Back to Listings
      </button>

      <div className="row g-4">
        
        <div className="col-lg-8">
          
          <div className="position-relative rounded-4 overflow-hidden shadow-sm mb-4" style={{ height: '420px' }}>
            <span className={`badge-status ${
              property.status === 'For Rent' || property.status === 'Rented' ? 'badge-rent' : 'badge-sale'
            }`} style={{ top: '1.5rem', right: '1.5rem', fontSize: '0.85rem' }}>
              {property.status}
            </span>
            <img 
              src={property.imageUrl || defaultImage} 
              alt={property.title} 
              className="w-100 h-100 object-fit-cover"
              onError={(e) => { e.target.src = defaultImage; }}
            />
          </div>

          
          <div className="card shadow-sm border-0 p-4 rounded-4 bg-white mb-4">
            <div className="d-flex align-items-center mb-3">
              <span className="badge bg-light text-primary border border-primary-subtle d-inline-flex align-items-center me-2 mb-2 px-3 py-2">
                <Home className="me-2" size={16} />
                {property.propertyType || 'Property'}
              </span>
            </div>

            <h1 className="fw-bold text-dark mb-3" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
              {property.title}
            </h1>

            <p className="text-muted d-flex align-items-center mb-4">
              <MapPin size={18} className="text-danger me-2" />
              <span className="fw-semibold">{property.location}</span>
            </p>

            <h5 className="fw-bold border-bottom pb-2 mb-3">Property Description</h5>
            <p className="text-muted lh-lg mb-0" style={{ whiteSpace: 'pre-line' }}>
              {property.description || "No description provided for this listing."}
            </p>
          </div>
        </div>

        
        <div className="col-lg-4">
          
          <div className="card shadow-sm border-0 p-4 rounded-4 bg-white mb-4 text-center">
            <span className="text-muted d-block small mb-1 uppercase tracking-wider">Price</span>
            <h2 className="display-6 fw-bold text-primary mb-0">{formatPrice(property.price, property.status)}</h2>
          </div>

          
          <div className="card shadow-sm border-0 p-4 rounded-4 bg-white mb-4">
            <h5 className="fw-bold mb-3 border-bottom pb-2">Overview Details</h5>
            <div className="d-flex flex-column gap-3">
              <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                <span className="text-muted d-flex align-items-center small"><Building2 size={16} className="me-2 text-primary" /> Type</span>
                <span className="fw-bold text-dark">{property.propertyType}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                <span className="text-muted d-flex align-items-center small"><BedDouble size={16} className="me-2 text-primary" /> Bedrooms</span>
                <span className="fw-bold text-dark">{property.bedrooms}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                <span className="text-muted d-flex align-items-center small"><Bath size={16} className="me-2 text-primary" /> Bathrooms</span>
                <span className="fw-bold text-dark">{property.bathrooms}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center pb-1">
                <span className="text-muted d-flex align-items-center small"><Maximize size={16} className="me-2 text-primary" /> Area</span>
                <span className="fw-bold text-dark">{property.area} m²</span>
              </div>
            </div>
          </div>

          
          <div className="card shadow-sm border-0 p-4 rounded-4 bg-dark text-white position-relative overflow-hidden">
            <div className="position-absolute bg-primary rounded-circle opacity-10" style={{ width: '120px', height: '120px', top: '-30px', right: '-30px', filter: 'blur(30px)' }}></div>
            
            <span className="badge bg-primary px-3 py-1 rounded-pill mb-3 fw-bold align-self-start d-inline-flex align-items-center" style={{ fontSize: '0.7rem' }}>
              <ShieldCheck size={12} className="me-1" /> VERIFIED LISTER
            </span>

            <h5 className="fw-bold text-white mb-4 border-bottom border-secondary pb-2">Lister Information</h5>
            
            {(property.ownerName || property.ownerEmail || property.ownerPhone) ? (
              <div className="d-flex flex-column gap-3 z-2 position-relative">
                {property.ownerName && (
                  <div className="mb-2">
                    <h6 className="fw-bold mb-0 text-white fs-5">{property.ownerName}</h6>
                  </div>
                )}

                
                {property.ownerEmail && (
                  <div className="d-flex align-items-center small text-white-50">
                    <Mail size={16} className="me-3 text-secondary flex-shrink-0" />
                    <a href={`mailto:${property.ownerEmail}`} className="text-white-50 text-decoration-none hover-text-primary text-truncate">{property.ownerEmail}</a>
                  </div>
                )}

                
                {property.ownerPhone && (
                  <div className="d-flex align-items-center mt-1">
                    <Phone size={16} className="me-3 text-secondary flex-shrink-0" />
                    <div>
                      <small className="text-white-50 d-block" style={{ fontSize: '0.7rem' }}>Contact Phone</small>
                      <a href={`tel:${property.ownerPhone}`} className="text-white fw-bold text-decoration-none hover-text-primary">
                        {property.ownerPhone}
                      </a>
                    </div>
                  </div>
                )}

                
                <div className="row g-2 mt-3">
                  {property.ownerPhone && (
                    <div className="col-6">
                      <a href={`tel:${property.ownerPhone}`} className="btn btn-sm btn-premium w-100 py-2 d-flex align-items-center justify-content-center">
                        <Phone size={14} className="me-1" /> Call
                      </a>
                    </div>
                  )}
                  {property.ownerEmail && (
                    <div className="col-6">
                      <a href={`mailto:${property.ownerEmail}`} className="btn btn-sm btn-outline-secondary text-white border-secondary w-100 py-2 d-flex align-items-center justify-content-center">
                        <Mail size={14} className="me-1" /> Email
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-white-50 small mb-0">No seller information available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
