import React, { useState, useEffect } from 'react';
import * as jobApi from '../services/jobServices';
import JobCard from '../components/JobCard';
import JobForm from '../components/JobForm';
import FormModal from '../components/FormModal';
import { useUser } from '../context/useUser';
import { Briefcase, SlidersHorizontal, Search, MapPin, Plus } from 'lucide-react';

const Jobs = ({ initialFilters, onViewJob }) => {
  const { currentUser } = useUser();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: initialFilters?.category || '',
    location: initialFilters?.location || ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const canAddJob = currentUser && currentUser.role !== 'user';
  const hasActiveFilters = Boolean(filters.category || filters.location);

  const loadJobs = () => {
    setLoading(true);
    jobApi.getAll({
      category: filters.category || undefined,
      location: filters.location || undefined
    })
      .then(data => setJobs(data))
      .catch(err => console.error("Error loading jobs:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadJobs();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ category: '', location: '' });
  };

  return (
    <div className="container fade-in-content mb-5 mt-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="fw-bold mb-1 text-dark d-flex align-items-center">
            <Briefcase className="text-success me-2" size={32} />
            Browse Jobs
          </h1>
          <p className="text-muted mb-0">Discover exciting career opportunities.</p>
        </div>
        {canAddJob && (
          <button onClick={() => setShowAddForm(true)} className="btn btn-premium d-flex align-items-center">
            <Plus size={18} className="me-2" />
            Add Job
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
              <label className="form-label fw-semibold text-muted small">Category Search</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted"><Search size={14} /></span>
                <input 
                  type="text" 
                  className="form-control border-start-0 bg-light" 
                  placeholder="e.g. IT, Healthcare" 
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
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
                  name="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
          </div>
        </div>

        
        <div className="col-lg-9">
          {loading ? (
            <div className="text-center py-5">
              <div className="loader-spinner mb-3"></div>
              <p className="text-muted fw-semibold">Fetching job listings...</p>
            </div>
          ) : (
            <>
              
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                  Showing <strong className="text-dark">{jobs.length}</strong> jobs
                </span>
              </div>

              
              <div className="row g-4">
                {jobs.map(job => (
                  <div className="col-12" key={job.jobId}>
                    <JobCard job={job} onView={onViewJob} />
                  </div>
                ))}

                
                {jobs.length === 0 && (
                  <div className="col-12 text-center py-5 px-4 rounded-4 bg-white shadow-sm border-0 my-4">
                    <Briefcase className="text-muted mx-auto mb-3" size={48} />
                    <h5 className="fw-bold">No Jobs Match Your Search</h5>
                    <p className="text-muted mx-auto mb-3" style={{ maxWidth: '400px' }}>
                      Try adjusting your category, locations, or clearing filters.
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
          <JobForm
            onSave={async (jobData) => {
              await jobApi.create(jobData);
              setShowAddForm(false);
              loadJobs();
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </FormModal>
      )}
    </div>
  );
};

export default Jobs;
