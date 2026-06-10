import React, { useState, useEffect } from 'react';
import * as serviceApi from '../services/servicesServices';
import { useUser } from '../context/useUser';
import { MapPin, Tag, User, Calendar, Mail, Phone, ChevronLeft, Wrench, ShieldCheck } from 'lucide-react';
import { getServiceVerificationClasses, getServiceVerificationLabel, SERVICE_VERIFICATION } from '../utils/serviceVerification';

const ServiceDetail = ({ serviceId, onBack }) => {
  const { currentUser } = useUser();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  useEffect(() => {
    if (!serviceId) return;
    setLoading(true);
    setImageLoadFailed(false);
    serviceApi.getById(serviceId)
      .then(data => {
        setService(data);
      })
      .catch(err => {
        console.error("Error fetching service detail:", err);
        setError("Failed to load service details. It might have been deleted.");
      })
      .finally(() => setLoading(false));
  }, [serviceId]);

  const serviceImageUrl = service?.imageUrl?.trim();
  const shouldShowServiceImage = Boolean(serviceImageUrl) && !imageLoadFailed;

  const canSeeModerationState =
    currentUser && service && (
      currentUser.role === 'admin' ||
      currentUser.role === 'subadmin' ||
      currentUser.userId === service.userId
    );

  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="loader-spinner mb-3"></div>
        <p className="text-muted fw-semibold">Loading service details...</p>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger py-4 rounded-4" role="alert">
          <p className="mb-3 fw-bold">{error || "Service not found."}</p>
          <button onClick={onBack} className="btn btn-outline-danger d-inline-flex align-items-center">
            <ChevronLeft size={16} className="me-1" /> Back to Services
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
          
          {shouldShowServiceImage && (
            <div className="rounded-4 overflow-hidden shadow-sm mb-4" style={{ height: '380px' }}>
              <img
                src={serviceImageUrl}
                alt={service.title}
                className="w-100 h-100 object-fit-cover"
                onError={() => setImageLoadFailed(true)}
              />
            </div>
          )}

          
          <div className="card shadow-sm border-0 p-4 rounded-4 bg-white mb-4">
            <div className="d-flex align-items-center mb-3">
              <span className="badge bg-light text-secondary border border-secondary-subtle d-flex align-items-center px-3 py-2 rounded-pill me-3">
                <Tag size={14} className="me-1" />
                Service
              </span>
              <span className="text-muted d-flex align-items-center small">
                <Calendar size={14} className="me-1" />
                Registered on {new Date(service.createdAt).toLocaleDateString()}
              </span>
            </div>

            <h1 className="fw-bold text-dark mb-3" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
              {service.title}
            </h1>

            <p className="text-muted d-flex align-items-center mb-4 gap-4">
              <span className="d-flex align-items-center">
                <MapPin size={18} className="text-danger me-2" />
                <span className="fw-semibold">{service.location}</span>
              </span>
              {service.yearsOfExperience > 0 && (
                <span className="d-flex align-items-center">
                  <Wrench size={18} className="text-primary me-2" />
                  <span className="fw-semibold">{service.yearsOfExperience} Years Exp.</span>
                </span>
              )}
            </p>

            {canSeeModerationState && (
              <div className={`d-inline-flex align-items-center rounded-pill px-3 py-2 mb-4 small fw-semibold ${getServiceVerificationClasses(service.verificationStatus)}`}>
                {getServiceVerificationLabel(service.verificationStatus)}
              </div>
            )}

            <h5 className="fw-bold border-bottom pb-2 mb-3">Service Details & Scope</h5>
            <p className="text-muted lh-lg mb-0" style={{ whiteSpace: 'pre-line' }}>
              {service.description || "No description provided for this service offering."}
            </p>
          </div>
        </div>

        
        <div className="col-lg-4">
          
          <div className="card shadow-sm border-0 p-4 rounded-4 bg-white mb-4 text-center">
            <span className="text-muted d-block small mb-1 uppercase tracking-wider">Service Rate</span>
            <h2 className="display-6 fw-bold text-secondary mb-3">
              ${service.price}
              <small className="text-muted fs-5">/hr</small>
            </h2>
            <p className="text-muted small mb-0">
              Contact the provider directly using the call or email options below.
            </p>
          </div>

          
          <div className="card shadow-sm border-0 p-4 rounded-4 bg-dark text-white position-relative overflow-hidden">
            <div className="position-absolute bg-secondary rounded-circle opacity-10" style={{ width: '120px', height: '120px', top: '-30px', right: '-30px', filter: 'blur(30px)' }}></div>
            
            <span className={`badge px-3 py-1 rounded-pill mb-3 fw-bold align-self-start d-inline-flex align-items-center ${service.verificationStatus === SERVICE_VERIFICATION.verified ? 'bg-secondary' : getServiceVerificationClasses(service.verificationStatus)}`} style={{ fontSize: '0.7rem' }}>
              <ShieldCheck size={12} className="me-1" />
              {service.verificationStatus === SERVICE_VERIFICATION.verified ? 'VERIFIED SERVICE' : getServiceVerificationLabel(service.verificationStatus).toUpperCase()}
            </span>

            <h5 className="fw-bold text-white mb-4 border-bottom border-secondary pb-2">Provider Details</h5>
            
            {service.user ? (
              <div className="d-flex flex-column gap-3 z-2 position-relative">
                <div className="d-flex align-items-center mb-2">
                  <div className="bg-primary text-white p-3 rounded-circle me-3">
                    <User size={24} />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0 text-white fs-5">{service.user.fullName}</h6>
                    <small className="text-white-50">{service.user.role || 'Service Professional'}</small>
                  </div>
                </div>

                
                <div className="d-flex align-items-center mt-1">
                  <Phone size={16} className="me-3 text-primary flex-shrink-0" />
                  <div>
                    <small className="text-white-50 d-block" style={{ fontSize: '0.7rem' }}>Contact Phone</small>
                    <a href={`tel:${service.phone || service.user.phoneNumber}`} className="text-white fw-bold text-decoration-none hover-text-primary">
                      {service.phone || service.user.phoneNumber || "+961 71 149 988"}
                    </a>
                  </div>
                </div>

                
                <div className="d-flex align-items-center mt-1">
                  <Mail size={16} className="me-3 text-primary flex-shrink-0" />
                  <div>
                    <small className="text-white-50 d-block" style={{ fontSize: '0.7rem' }}>Email Address</small>
                    <a href={`mailto:${service.email || service.user.email}`} className="text-white fw-bold text-decoration-none hover-text-primary text-truncate">
                      {service.email || service.user.email}
                    </a>
                  </div>
                </div>

                
                {service.links && (
                  <div className="d-flex align-items-center mt-1">
                    <ShieldCheck size={16} className="me-3 text-primary flex-shrink-0" />
                    <div>
                      <small className="text-white-50 d-block" style={{ fontSize: '0.7rem' }}>Portfolio/Links</small>
                      <a href={service.links.startsWith('http') ? service.links : `https://${service.links}`} target="_blank" rel="noopener noreferrer" className="text-white fw-bold text-decoration-none hover-text-primary text-truncate">
                        {service.links}
                      </a>
                    </div>
                  </div>
                )}

                
                <div className="row g-2 mt-3">
                  <div className="col-6">
                    <a href={`tel:${service.phone || service.user.phoneNumber || "+961 71 149 988"}`} className="btn btn-sm btn-premium w-100 py-2 d-flex align-items-center justify-content-center" style={{ background: 'var(--grad-sunset)' }}>
                      <Phone size={14} className="me-1" /> Call
                    </a>
                  </div>
                  <div className="col-6">
                    <a href={`mailto:${service.email || service.user.email}`} className="btn btn-sm btn-outline-secondary text-white border-secondary w-100 py-2 d-flex align-items-center justify-content-center">
                      <Mail size={14} className="me-1" /> Email
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-white-50 small mb-0">No provider information available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
