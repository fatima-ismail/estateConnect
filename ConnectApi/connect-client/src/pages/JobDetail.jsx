import { useState, useEffect } from 'react';
import * as jobApi from '../services/jobServices';
import { Briefcase, MapPin, Building, Clock, DollarSign, Mail, Phone, ChevronLeft, Calendar } from 'lucide-react';

const JobDetail = ({ jobId, onBack }) => {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    jobApi.getById(jobId)
      .then(data => setJob(data))
      .catch(err => console.error("Failed to fetch job details:", err))
      .finally(() => setLoading(false));
  }, [jobId]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="loader-spinner mb-3"></div>
        <p className="text-muted fw-semibold">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container py-5 text-center">
        <h4 className="fw-bold">Job Not Found</h4>
        <button onClick={onBack} className="btn btn-outline-primary mt-3">Back to Jobs</button>
      </div>
    );
  }

  return (
    <div className="fade-in-content bg-light min-vh-100 pb-5">
      <div className="bg-white border-bottom shadow-sm mb-4">
        <div className="container py-3">
          <button onClick={onBack} className="btn btn-link text-decoration-none text-muted d-flex align-items-center p-0 hover-text-primary">
            <ChevronLeft size={20} className="me-1" /> Back to Jobs
          </button>
        </div>
      </div>

      <div className="container">
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2">{job.category || 'Job'}</span>
                <span className={`badge ${job.status === 'Open' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'} rounded-pill px-3 py-2`}>
                  {job.status}
                </span>
              </div>
              <h2 className="fw-bold text-dark mb-2">{job.jobTitle}</h2>
              <h5 className="text-muted d-flex align-items-center mb-4">
                <Building size={20} className="me-2 text-secondary" />
                {job.companyName}
              </h5>

              <div className="d-flex flex-wrap gap-3 mb-4">
                <div className="d-flex align-items-center bg-light p-2 rounded-3 border">
                  <MapPin size={16} className="text-primary me-2" />
                  <span className="fw-medium small">{job.location}</span>
                </div>
                <div className="d-flex align-items-center bg-light p-2 rounded-3 border">
                  <Briefcase size={16} className="text-primary me-2" />
                  <span className="fw-medium small">{job.workType}</span>
                </div>
                <div className="d-flex align-items-center bg-light p-2 rounded-3 border">
                  <Clock size={16} className="text-primary me-2" />
                  <span className="fw-medium small">{job.jobType}</span>
                </div>
                <div className="d-flex align-items-center bg-light p-2 rounded-3 border">
                  <Calendar size={16} className="text-primary me-2" />
                  <span className="fw-medium small">Min {job.experienceYears} Years Exp.</span>
                </div>
              </div>

              <hr className="text-muted mb-4" />

              <h5 className="fw-bold mb-3 d-flex align-items-center">
                <Briefcase className="text-primary me-2" size={20}/>
                Job Description
              </h5>
              <div className="text-muted lh-lg mb-0" style={{ whiteSpace: 'pre-line' }}>
                {job.jobDescription}
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 mb-4 p-4 sticky-top" style={{ top: '100px' }}>
              <h5 className="fw-bold mb-3">Salary Range</h5>
              <div className="d-flex align-items-center mb-4">
                <DollarSign size={24} className="text-success me-2" />
                <span className="fs-3 fw-bold text-dark">
                  ${job.salaryFrom?.toLocaleString()} - ${job.salaryTo?.toLocaleString()}
                </span>
                <span className="text-muted ms-1">/mo</span>
              </div>
              
              <hr className="text-muted my-4" />
              
              <h5 className="fw-bold mb-3">Contact Employer</h5>
              <div className="d-grid gap-3">
                {job.contactPhone && (
                  <a href={`tel:${job.contactPhone}`} className="btn btn-outline-primary rounded-pill py-2 d-flex align-items-center justify-content-center">
                    <Phone size={18} className="me-2" />
                    {job.contactPhone}
                  </a>
                )}
                {job.contactEmail && (
                  <a href={`mailto:${job.contactEmail}`} className="btn btn-premium rounded-pill py-2 d-flex align-items-center justify-content-center">
                    <Mail size={18} className="me-2" />
                    Email Employer
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
