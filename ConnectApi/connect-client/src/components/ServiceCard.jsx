
import { MapPin, Tag, User, Calendar, Sparkles, Edit, Trash2 } from 'lucide-react';
import { getServiceVerificationClasses, getServiceVerificationLabel, SERVICE_VERIFICATION } from '../utils/serviceVerification';
import { serviceImagePlaceholder, useServiceImagePlaceholder } from '../utils/serviceImage';

const ServiceCard = ({ service, onView, onEdit, onDelete, showActions = false, showVerificationStatus = false }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  const isVerified = service.verificationStatus === SERVICE_VERIFICATION.verified;
  const shouldDimCard = showVerificationStatus && !isVerified;

  return (
    <div
      className="card bg-white shadow-sm h-100 border-0 overflow-hidden position-relative"
      onClick={() => onView && onView(service.homeServiceId)}
      style={{
        ...(shouldDimCard ? { opacity: 0.68, transform: 'translateY(8px)' } : {}),
        cursor: onView ? 'pointer' : 'default'
      }}
    >
      <div className="position-absolute top-0 end-0 m-3" style={{ zIndex: 2 }}>
        <span className={`badge rounded-pill shadow-sm px-3 py-2 text-uppercase d-flex align-items-center ${isVerified ? 'bg-dark text-white' : getServiceVerificationClasses(service.verificationStatus)}`}>
          <Sparkles size={12} className={`me-1 ${isVerified ? 'text-warning' : ''}`} />
          {showVerificationStatus ? getServiceVerificationLabel(service.verificationStatus) : 'Verified'}
        </span>
      </div>

      <div className="bg-light d-flex justify-content-center align-items-center" style={{ height: '180px' }}>
        {service.imageUrl ? (
          <img 
            src={service.imageUrl} 
            alt={service.title} 
            className="w-100 h-100 object-fit-cover"
            onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<div class="text-secondary opacity-50 fw-bold">NO IMAGE</div>'; }}
          />
        ) : (
          <div className="text-secondary opacity-50 fw-bold">NO IMAGE</div>
        )}
      </div>

      <div className="card-body d-flex flex-column p-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="badge bg-light text-secondary border border-secondary-subtle d-flex align-items-center">
            <Tag size={12} className="me-1" />
            Service
          </span>
          <span className="text-muted d-flex align-items-center" style={{ fontSize: '0.75rem' }}>
            <Calendar size={12} className="me-1" />
            {new Date(service.createdAt).toLocaleDateString()}
          </span>
        </div>

        <h5 className="card-title fw-bold text-dark text-truncate mb-2 hover-text-primary" title={service.title}>
          {service.title}
        </h5>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <p className="card-text text-muted d-flex align-items-center mb-0" style={{ fontSize: '0.85rem' }}>
            <MapPin size={14} className="text-danger me-1 flex-shrink-0" />
            <span className="text-truncate">{service.location}</span>
          </p>
          {service.yearsOfExperience > 0 && (
            <span className="badge bg-light text-primary border" style={{ fontSize: '0.7rem' }}>
              {service.yearsOfExperience} Yrs Exp
            </span>
          )}
        </div>

        <p className="card-text text-muted flex-grow-1" style={{ fontSize: '0.85rem', display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {service.description}
        </p>

        {showVerificationStatus && (
          <div className={`small rounded-3 px-3 py-2 mb-3 ${getServiceVerificationClasses(service.verificationStatus)}`}>
            {service.verificationStatus === SERVICE_VERIFICATION.verified && 'Visible to all users because this service has been approved by admin.'}
            {service.verificationStatus === SERVICE_VERIFICATION.inProgress && 'Waiting for admin review. This service is not visible in public browsing yet.'}
            {service.verificationStatus === SERVICE_VERIFICATION.notAccepted && 'Not accepted by admin. Edit the service and submit again for a new review.'}
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center pt-3 border-top mt-auto">
          <div>
            <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Rate</span>
            <span className="fs-5 fw-bold text-secondary">{formatPrice(service.price)}<small className="text-muted fs-6 font-monospace">/hr</small></span>
          </div>
          {service.user && (
            <div className="text-end">
              <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Provider</span>
              <span className="d-flex align-items-center text-dark fw-semibold" style={{ fontSize: '0.85rem' }}>
                <User size={12} className="me-1 text-primary" />
                {service.user.fullName}
              </span>
            </div>
          )}
        </div>

        {showActions ? (
          (onEdit || onDelete) && (
            <div className="d-flex gap-2 mt-3 pt-3 border-top">
              {onEdit && (
                <button 
                  onClick={(event) => { event.stopPropagation(); onEdit(service); }} 
                  className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center flex-grow-1 py-2"
                >
                  <Edit size={14} className="me-1" />
                  Edit
                </button>
              )}
              {onDelete && (
                <button 
                  onClick={(event) => { event.stopPropagation(); onDelete(service.homeServiceId); }} 
                  className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center flex-grow-1 py-2"
                >
                  <Trash2 size={14} className="me-1" />
                  Delete
                </button>
              )}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
};

export default ServiceCard;
