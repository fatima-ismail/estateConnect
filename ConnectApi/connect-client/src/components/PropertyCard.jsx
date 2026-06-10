
import { BedDouble, Bath, Maximize, MapPin, Tag, User, Calendar, Edit, Trash2, Sparkles } from 'lucide-react';
import { getServiceVerificationClasses, getServiceVerificationLabel, SERVICE_VERIFICATION } from '../utils/serviceVerification';

const PropertyCard = ({ property, onView, onEdit, onDelete, showActions = false, showVerificationStatus = false }) => {

  const formatPrice = (price, status) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
    
    return status === 'For Rent' || status === 'Rented' ? `${formatted}/mo` : formatted;
  };

  const defaultImage = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80";
  const isVerified = property.verificationStatus === SERVICE_VERIFICATION.verified;
  const shouldDimCard = showVerificationStatus && !isVerified;

  return (
    <div 
      className="card shadow-sm h-100 border-0 overflow-hidden position-relative"
      onClick={() => onView && onView(property.propertyId)}
      style={{
        ...(shouldDimCard ? { opacity: 0.68, transform: 'translateY(8px)' } : {}),
        cursor: onView ? 'pointer' : 'default'
      }}
    >
    
      <div className="position-absolute top-0 start-0 m-3 d-flex flex-column gap-2" style={{ zIndex: 2 }}>
        <span className="badge rounded-pill bg-danger shadow-sm text-uppercase px-3 py-2">
          {property.status}
        </span>
        {showVerificationStatus && (
          <span className={`badge rounded-pill shadow-sm text-uppercase px-3 py-2 d-flex align-items-center ${isVerified ? 'bg-dark text-white' : getServiceVerificationClasses(property.verificationStatus)}`}>
            <Sparkles size={12} className={`me-1 ${isVerified ? 'text-warning' : ''}`} />
            {getServiceVerificationLabel(property.verificationStatus)}
          </span>
        )}
      </div>

      <div className="bg-light d-flex justify-content-center align-items-center" style={{ height: '220px' }}>
        {property.imageUrl ? (
          <img 
            src={property.imageUrl} 
            alt={property.title} 
            className="w-100 h-100 object-fit-cover"
          />
        ) : (
          <div className="text-secondary opacity-50 fw-bold">NO IMAGE</div>
        )}
      </div>


      <div className="card-body d-flex flex-column p-4">

        <div className="d-flex justify-content-end align-items-center mb-2">
          <span className="text-muted d-flex align-items-center" style={{ fontSize: '0.75rem' }}>
            <Calendar size={12} className="me-1" />
            {new Date(property.createdAt).toLocaleDateString()}
          </span>
        </div>

        <h5 className="card-title fw-bold text-dark text-truncate mb-2 hover-text-primary" title={property.title}>
          {property.title}
        </h5>

        
        <div className="d-flex align-items-center flex-wrap gap-3 mb-3">
          <p className="card-text text-muted d-flex align-items-center mb-0" style={{ fontSize: '0.85rem' }}>
            <MapPin size={14} className="text-danger me-1 flex-shrink-0" />
            <span className="text-truncate">{property.location}</span>
          </p>
          {property.propertyType && (
            <p className="card-text text-muted d-flex align-items-center mb-0" style={{ fontSize: '0.85rem' }}>
              <Tag size={13} className="text-primary me-1 flex-shrink-0" />
              <span>{property.propertyType}</span>
            </p>
          )}
        </div>

        
        <div className="row g-2 py-3 border-top border-bottom mb-3 text-center" style={{ fontSize: '0.85rem' }}>
          <div className="col-4 border-end">
            <div className="text-muted d-flex align-items-center justify-content-center mb-1">
              <BedDouble size={14} className="me-1 text-primary" />
              <span>Beds</span>
            </div>
            <strong className="text-dark">{property.bedrooms}</strong>
          </div>
          <div className="col-4 border-end">
            <div className="text-muted d-flex align-items-center justify-content-center mb-1">
              <Bath size={14} className="me-1 text-primary" />
              <span>Baths</span>
            </div>
            <strong className="text-dark">{property.bathrooms}</strong>
          </div>
          <div className="col-4">
            <div className="text-muted d-flex align-items-center justify-content-center mb-1">
              <Maximize size={14} className="me-1 text-primary" />
              <span>Area</span>
            </div>
            <strong className="text-dark">{property.area} <small>m²</small></strong>
          </div>
        </div>

        <p className="card-text text-muted flex-grow-1" style={{ fontSize: '0.85rem', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {property.description}
        </p>

        {showVerificationStatus && (
          <div className={`small rounded-3 px-3 py-2 mb-3 ${getServiceVerificationClasses(property.verificationStatus)}`}>
            {property.verificationStatus === SERVICE_VERIFICATION.verified && 'Visible to all users because this property has been approved by admin.'}
            {property.verificationStatus === SERVICE_VERIFICATION.inProgress && 'Waiting for admin review. This property is not visible in public browsing yet.'}
            {property.verificationStatus === SERVICE_VERIFICATION.notAccepted && 'Not accepted by admin. Edit the property and submit again for a new review.'}
          </div>
        )}

    
        <div className="d-flex justify-content-between align-items-center pt-3 border-top mt-auto">
          <div>
            <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Price</span>
            <span className="fs-5 fw-bold text-primary">{formatPrice(property.price, property.status)}</span>
          </div>
          {!onView && (
            property.user && (
              <div className="text-end">
                <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Listed by</span>
                <span className="d-flex align-items-center text-dark fw-semibold" style={{ fontSize: '0.85rem' }}>
                  <User size={12} className="me-1 text-secondary" />
                  {property.user.fullName}
                </span>
              </div>
            )
          )}
        </div>

        {showActions && (onEdit || onDelete) && (
          <div className="d-flex gap-2 mt-3 pt-3 border-top">
            {onEdit && (
              <button 
                onClick={(event) => { event.stopPropagation(); onEdit(property); }} 
                className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center flex-grow-1 py-2"
              >
                <Edit size={14} className="me-1" />
                Edit
              </button>
            )}
            {onDelete && (
              <button 
                onClick={(event) => { event.stopPropagation(); onDelete(property.propertyId); }} 
                className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center flex-grow-1 py-2"
              >
                <Trash2 size={14} className="me-1" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyCard;
