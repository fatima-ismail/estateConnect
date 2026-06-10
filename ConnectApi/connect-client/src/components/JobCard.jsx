
import { Briefcase, MapPin, Building, Clock, Sparkles } from 'lucide-react';
import { getServiceVerificationClasses, getServiceVerificationLabel, SERVICE_VERIFICATION } from '../utils/serviceVerification';

const JobCard = ({ job, onView, onEdit, onDelete, showActions = false, showVerificationStatus = false }) => {
  const isVerified = job.verificationStatus === SERVICE_VERIFICATION.verified;
  const shouldDimCard = showVerificationStatus && !isVerified;
  return (
    <div 
      className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden hover-lift transition-all"
      onClick={() => onView && onView(job.jobId)}
      style={{
        ...(shouldDimCard ? { opacity: 0.68, transform: 'translateY(8px)' } : {}),
        cursor: onView ? 'pointer' : 'default'
      }}
    >
      <div className="card-body p-4 position-relative z-1 d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
          <div className="d-flex gap-2">
            <span className="badge bg-primary-subtle text-primary rounded-pill px-3">{job.category || 'Job'}</span>
            <span className={`badge ${job.status === 'Open' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'} rounded-pill px-3`}>
              {job.status}
            </span>
          </div>
          {showVerificationStatus && (
            <span className={`badge d-flex align-items-center ${isVerified ? 'bg-dark text-white' : getServiceVerificationClasses(job.verificationStatus)} rounded-pill px-3`}>
              <Sparkles size={12} className={`me-1 ${isVerified ? 'text-warning' : ''}`} />
              {getServiceVerificationLabel(job.verificationStatus)}
            </span>
          )}
        </div>
        
        <h5 className="card-title fw-bold text-dark mb-1 text-truncate" title={job.jobTitle}>
          {job.jobTitle}
        </h5>
        <div className="d-flex align-items-center text-muted small mb-3">
          <Building size={14} className="me-1" />
          <span className="me-3 text-truncate">{job.companyName}</span>
        </div>
        
        <div className="d-flex flex-wrap gap-2 mb-4">
          <span className="badge bg-light text-dark fw-normal border"><MapPin size={12} className="me-1"/>{job.location}</span>
          <span className="badge bg-light text-dark fw-normal border"><Briefcase size={12} className="me-1"/>{job.workType}</span>
          <span className="badge bg-light text-dark fw-normal border"><Clock size={12} className="me-1"/>{job.jobType}</span>
        </div>

        {showVerificationStatus && (
          <div className={`small rounded-3 px-3 py-2 mb-3 ${getServiceVerificationClasses(job.verificationStatus)}`}>
            {job.verificationStatus === SERVICE_VERIFICATION.verified && 'Visible to all users because this job has been approved by admin.'}
            {job.verificationStatus === SERVICE_VERIFICATION.inProgress && 'Waiting for admin review. This job is not visible in public browsing yet.'}
            {job.verificationStatus === SERVICE_VERIFICATION.notAccepted && 'Not accepted by admin. Edit the job and submit again for a new review.'}
          </div>
        )}
        
        <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
          <div className="text-primary fw-bold">
            ${job.salaryFrom?.toLocaleString() || 0} - ${job.salaryTo?.toLocaleString() || 0} <span className="text-muted fw-normal small">/mo</span>
          </div>
        </div>

        {showActions ? (
          <div className="d-flex gap-2 mt-3 w-100">
            <button onClick={(event) => { event.stopPropagation(); onEdit(job); }} className="btn btn-outline-primary btn-sm flex-grow-1 rounded-pill">
              Edit
            </button>
            <button onClick={(event) => { event.stopPropagation(); onDelete(job.jobId); }} className="btn btn-outline-danger btn-sm flex-grow-1 rounded-pill">
              Delete
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default JobCard;
