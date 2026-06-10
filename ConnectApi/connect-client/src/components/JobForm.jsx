import { useState } from 'react';
import { useUser } from '../context/useUser';
import { hasText } from '../utils/formValidation';
import { getApiErrorMessage } from '../utils/apiError';
import {
  Briefcase,
  MapPin,
  Clipboard,
  DollarSign,
  PlusCircle,
  Check
} from 'lucide-react';

const getInitialFormData = (job, userId) => ({
  jobId: job?.jobId || 0,
  userId: job?.userId || userId,
  jobTitle: job?.jobTitle || '',
  category: job?.category || '',
  workType: job?.workType || 'Full-time',
  location: job?.location || '',
  jobType: job?.jobType || 'On-site',
  jobDescription: job?.jobDescription || '',
  status: job?.status || 'Open',
  salaryFrom: job?.salaryFrom ?? '',
  salaryTo: job?.salaryTo ?? '',
  experienceYears: job?.experienceYears ?? 0
});

const JobForm = ({ job = null, onSave, onCancel }) => {
  const { currentUser } = useUser();
  const isModerator = ['admin', 'subadmin'].includes(currentUser?.role);
  const [formData, setFormData] = useState(() => getInitialFormData(job, currentUser?.userId));
  const [globalError, setGlobalError] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    if (globalError) setGlobalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};
    if (!hasText(formData.jobTitle)) newErrors.jobTitle = 'Job title is required';
    if (!hasText(formData.category)) newErrors.category = 'Category is required';
    if (!hasText(formData.location)) newErrors.location = 'Location is required';
    if (!hasText(formData.jobDescription)) newErrors.jobDescription = 'Description is required';
    
    if (formData.salaryFrom === '') newErrors.salaryFrom = 'Required';
    else if (Number(formData.salaryFrom) < 0) newErrors.salaryFrom = 'Must be >= 0';
    
    if (formData.salaryTo === '') newErrors.salaryTo = 'Required';
    else if (Number(formData.salaryTo) < 0) newErrors.salaryTo = 'Must be >= 0';
    else if (Number(formData.salaryTo) < Number(formData.salaryFrom)) newErrors.salaryTo = 'Cannot be less than Salary From';

    if (!Number.isInteger(Number(formData.experienceYears)) || Number(formData.experienceYears) < 0) {
      newErrors.experienceYears = 'Must be a whole number >= 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setGlobalError('Please complete all required fields before submitting.');
      return;
    }

    if (job) {
      const initial = getInitialFormData(job, currentUser?.userId);
      const hasChanges = Object.keys(initial).some(key => {
        if (['jobId', 'userId'].includes(key)) return false;
        if (['salaryFrom', 'salaryTo', 'experienceYears'].includes(key)) {
          return Number(formData[key]) !== Number(initial[key]);
        }
        return formData[key] !== initial[key];
      });

      if (!hasChanges) {
        handleCancel();
        return;
      }
    }

    setLoading(true);
    setGlobalError('');
    setErrors({});

    try {
      await onSave({
        ...formData,
        jobTitle: formData.jobTitle.trim(),
        category: formData.category.trim(),
        companyName: currentUser?.fullName || '',
        location: formData.location.trim(),
        jobDescription: formData.jobDescription.trim(),
        contactPhone: currentUser?.phoneNumber || '',
        contactEmail: currentUser?.email || '',
        salaryFrom: Number(formData.salaryFrom),
        salaryTo: Number(formData.salaryTo),
        experienceYears: Number(formData.experienceYears)
      });
      setFormData(getInitialFormData(null, currentUser?.userId));
      setErrors({});
      setGlobalError('');
    } catch (err) {
      setGlobalError(getApiErrorMessage(err, 'Failed to save job. Verify input details.'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(getInitialFormData(null, currentUser?.userId));
    setErrors({});
    setGlobalError('');
    onCancel();
  };

  return (
    <div className="card form-modern p-4 p-md-5 fade-in-content">
      <h3 className="form-heading">
        <div className="form-icon-tile text-primary">
          <Briefcase className="text-primary" size={24} />
        </div>
        {job ? 'Edit Job Posting' : 'Post a New Job'}
      </h3>

      {globalError && (
        <div className="alert alert-danger py-2 px-3 mb-4 rounded-3 d-flex align-items-center" role="alert">
          {globalError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          <div className="col-12">
            <div className={`input-group ${errors.jobTitle ? 'is-invalid' : ''}`}>
              <span className="input-group-text bg-transparent border-end-0 text-muted px-3">
                <Clipboard size={18} />
              </span>
              <div className="form-floating flex-grow-1">
                <input
                  type="text"
                  name="jobTitle"
                  id="jobTitle"
                  className={`form-control border-start-0 ps-0 ${errors.jobTitle ? 'is-invalid' : ''}`}
                  placeholder="Job Title"
                  value={formData.jobTitle}
                  onChange={handleChange}
                />
                <label htmlFor="jobTitle" className="text-muted ps-0">Job Title *</label>
              </div>
            </div>
            {errors.jobTitle && <div className="text-danger small mt-1 ps-2">{errors.jobTitle}</div>}
          </div>
          
          <div className="col-md-4">
            <div className="form-floating">
              <input
                type="text"
                name="category"
                id="category"
                className={`form-control bg-light ${errors.category ? 'is-invalid' : ''}`}
                placeholder="Category"
                value={formData.category}
                onChange={handleChange}
              />
              <label htmlFor="category">Category (e.g. IT) *</label>
            </div>
            {errors.category && <div className="text-danger small mt-1 ps-2">{errors.category}</div>}
          </div>

          <div className="col-md-4">
            <div className="form-floating">
              <select className="form-select bg-light" id="workType" name="workType" value={formData.workType} onChange={handleChange}>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
              </select>
              <label htmlFor="workType">Work Type</label>
            </div>
          </div>

          <div className="col-md-4">
            <div className="form-floating">
              <select className="form-select bg-light" id="jobType" name="jobType" value={formData.jobType} onChange={handleChange}>
                <option value="On-site">On-site</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
              <label htmlFor="jobType">Job Setting</label>
            </div>
          </div>

          <div className="col-md-6">
            <div className={`input-group ${errors.location ? 'is-invalid' : ''}`}>
              <span className="input-group-text bg-transparent border-end-0 text-muted px-3">
                <MapPin size={18} />
              </span>
              <div className="form-floating flex-grow-1">
                <input
                  type="text"
                  name="location"
                  id="jobLocation"
                  className={`form-control border-start-0 ps-0 ${errors.location ? 'is-invalid' : ''}`}
                  placeholder="Location"
                  value={formData.location}
                  onChange={handleChange}
                />
                <label htmlFor="jobLocation" className="text-muted ps-0">Location *</label>
              </div>
            </div>
            {errors.location && <div className="text-danger small mt-1 ps-2">{errors.location}</div>}
          </div>

          <div className="col-md-6">
            <div className="form-floating">
              <select className="form-select bg-light" id="status" name="status" value={formData.status} onChange={handleChange}>
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
              <label htmlFor="status">Status</label>
            </div>
          </div>

          <div className="col-md-4">
            <div className={`input-group ${errors.salaryFrom ? 'is-invalid' : ''}`}>
              <span className="input-group-text bg-transparent border-end-0 text-muted px-3">
                <DollarSign size={18} />
              </span>
              <div className="form-floating flex-grow-1">
                <input
                  type="number"
                  name="salaryFrom"
                  id="salaryFrom"
                  className={`form-control border-start-0 ps-0 ${errors.salaryFrom ? 'is-invalid' : ''}`}
                  placeholder="Salary From"
                  value={formData.salaryFrom}
                  onChange={handleChange}
                  min="0"
                />
                <label htmlFor="salaryFrom" className="text-muted ps-0">Salary From ($)</label>
              </div>
            </div>
            {errors.salaryFrom && <div className="text-danger small mt-1 ps-2">{errors.salaryFrom}</div>}
          </div>

          <div className="col-md-4">
            <div className={`input-group ${errors.salaryTo ? 'is-invalid' : ''}`}>
              <span className="input-group-text bg-transparent border-end-0 text-muted px-3">
                <DollarSign size={18} />
              </span>
              <div className="form-floating flex-grow-1">
                <input
                  type="number"
                  name="salaryTo"
                  id="salaryTo"
                  className={`form-control border-start-0 ps-0 ${errors.salaryTo ? 'is-invalid' : ''}`}
                  placeholder="Salary To"
                  value={formData.salaryTo}
                  onChange={handleChange}
                  min="0"
                />
                <label htmlFor="salaryTo" className="text-muted ps-0">Salary To ($)</label>
              </div>
            </div>
            {errors.salaryTo && <div className="text-danger small mt-1 ps-2">{errors.salaryTo}</div>}
          </div>

          <div className="col-md-4">
            <div className="form-floating">
              <input
                type="number"
                name="experienceYears"
                id="experienceYears"
                className={`form-control bg-light ${errors.experienceYears ? 'is-invalid' : ''}`}
                placeholder="Experience Years"
                value={formData.experienceYears}
                onChange={handleChange}
                min="0"
                step="1"
            />
              <label htmlFor="experienceYears">Experience Years</label>
            </div>
            {errors.experienceYears && <div className="text-danger small mt-1 ps-2">{errors.experienceYears}</div>}
          </div>

          <div className="col-12">
            <div className="form-floating">
              <textarea
                className={`form-control bg-light ${errors.jobDescription ? 'is-invalid' : ''}`}
                name="jobDescription"
                id="jobDescription"
                style={{ height: '120px' }}
                placeholder="Job Description"
                value={formData.jobDescription}
                onChange={handleChange}
              />
              <label htmlFor="jobDescription">Job Description *</label>
            </div>
            {errors.jobDescription && <div className="text-danger small mt-1 ps-2">{errors.jobDescription}</div>}
          </div>
        </div>

        {!isModerator && (
          <div className="alert alert-warning d-flex align-items-start rounded-4 py-3 px-3 mt-4 mb-0" role="alert">
            <div>
              <strong className="d-block mb-1">Admin review required</strong>
              <span className="small">
                Every new or updated job is submitted with <strong>In Progress</strong> status and stays hidden from public job browsing until an admin verifies it.
              </span>
            </div>
          </div>
        )}

        <div className="d-flex justify-content-end gap-3 mt-4 pt-4 border-top">
          <button type="button" className="btn btn-light px-4 py-2 rounded-3 fw-medium" onClick={handleCancel} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-premium d-flex align-items-center px-4 py-2 rounded-3 shadow-sm" disabled={loading}>
            {loading ? (
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
            ) : job ? (
              <Check size={18} className="me-2" />
            ) : (
              <PlusCircle size={18} className="me-2" />
            )}
            {job ? 'Update Job' : 'Post Job'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobForm;
