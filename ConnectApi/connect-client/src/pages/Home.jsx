import { useState, useEffect } from 'react';
import HeroSection from '../components/HeroSection';
import PropertyCard from '../components/PropertyCard';
import ServiceCard from '../components/ServiceCard';
import JobCard from '../components/JobCard';
import * as propertyApi from '../services/propertyServices';
import * as serviceApi from '../services/servicesServices';
import * as jobApi from '../services/jobServices';
import * as userApi from '../services/userServices';
import { Building, Wrench, Briefcase, ArrowRight, ShieldCheck, Sparkles, CheckCircle, PhoneCall, LayoutDashboard, Mail, Trash2 } from 'lucide-react';
import { useUser } from '../context/useUser';
import { getApiErrorMessage } from '../utils/apiError';
import { getServiceVerificationLabel } from '../utils/serviceVerification';

const Home = ({ setActivePage, setFilters, navigate }) => {
  const { currentUser } = useUser();
  const isAdmin = currentUser?.role === 'admin';

  const [properties, setProperties] = useState([]);
  const [services, setServices] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminContact, setAdminContact] = useState({
    email: 'admin@estateconnect.com',
    phoneNumber: '+96101000000'
  });

  const [adminsList, setAdminsList] = useState([]);
  const [adminActivityListings, setAdminActivityListings] = useState({ properties: [], services: [], jobs: [] });
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [selectedActivityUser, setSelectedActivityUser] = useState(null);
  const [adminAction, setAdminAction] = useState(null);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  useEffect(() => {
    if (isAdmin) {
      setLoadingAdmin(true);
      Promise.all([
        userApi.getAll(),
        propertyApi.getAll({ includeUnverified: true }),
        serviceApi.getAll({ includeUnverified: true }),
        jobApi.getAll({ includeUnverified: true })
      ])
        .then(([usersData, propsData, svcsData, jobsData]) => {
          setAdminsList(usersData.filter(u => u.role !== 'admin'));
          setAdminActivityListings({ properties: propsData, services: svcsData, jobs: jobsData });
        })
        .catch(err => console.error("Error loading admin data:", err))
        .finally(() => setLoadingAdmin(false));
    } else {
      setLoading(true);
      Promise.all([
        propertyApi.getAll(),
        serviceApi.getAll(),
        jobApi.getAll()
      ])
        .then(([propsData, svcsData, jobsData]) => {
          setProperties(propsData.slice(0, 3));
          setServices(svcsData.slice(0, 3));
          setJobs(jobsData.slice(0, 3));
        })
        .catch(err => console.error("Error loading featured data:", err))
        .finally(() => setLoading(false));
    }
  }, [isAdmin]);

  useEffect(() => {
    userApi.getAdminContact()
      .then(setAdminContact)
      .catch(err => console.error("Error loading admin contact:", err));
  }, []);

  const handleManagedUserDelete = async (user) => {
    const listingCount =
      adminActivityListings.properties.filter(item => item.userId === user.userId).length +
      adminActivityListings.services.filter(item => item.userId === user.userId).length +
      adminActivityListings.jobs.filter(item => item.userId === user.userId).length;

    const message = listingCount > 0
      ? `Delete ${user.fullName}? This will also delete ${listingCount} listing${listingCount === 1 ? '' : 's'} added by this account.`
      : `Delete ${user.fullName}?`;

    if (!window.confirm(message)) return;

    setAdminAction(`user-${user.userId}`);
    setAdminError('');
    setAdminSuccess('');
    try {
      await userApi.remove(user.userId);
      setAdminsList(prev => prev.filter(item => item.userId !== user.userId));
      setSelectedActivityUser(prev => prev?.userId === user.userId ? null : prev);
      setAdminActivityListings(prev => ({
        properties: prev.properties.filter(item => item.userId !== user.userId),
        services: prev.services.filter(item => item.userId !== user.userId),
        jobs: prev.jobs.filter(item => item.userId !== user.userId)
      }));
      setAdminSuccess('Account deleted successfully.');
    } catch (err) {
      setAdminError(getApiErrorMessage(err, 'Failed to delete account.'));
    } finally {
      setAdminAction(null);
    }
  };

  const handleListingDelete = async (type, item) => {
    const config = {
      property: { label: 'property', id: item.propertyId, remove: propertyApi.remove, stateKey: 'properties' },
      service: { label: 'service', id: item.homeServiceId, remove: serviceApi.remove, stateKey: 'services' },
      job: { label: 'job', id: item.jobId, remove: jobApi.remove, stateKey: 'jobs' }
    }[type];

    if (!config || !window.confirm(`Delete this ${config.label}?`)) return;

    setAdminAction(`${type}-${config.id}`);
    setAdminError('');
    setAdminSuccess('');
    try {
      await config.remove(config.id, currentUser.userId);
      setAdminActivityListings(prev => ({
        ...prev,
        [config.stateKey]: prev[config.stateKey].filter(listing => {
          if (type === 'property') return listing.propertyId !== config.id;
          if (type === 'service') return listing.homeServiceId !== config.id;
          return listing.jobId !== config.id;
        })
      }));
      setAdminSuccess(`${config.label[0].toUpperCase()}${config.label.slice(1)} deleted successfully.`);
    } catch (err) {
      setAdminError(getApiErrorMessage(err, `Failed to delete ${config.label}.`));
    } finally {
      setAdminAction(null);
    }
  };

  if (isAdmin) {
    return (
      <div className="container py-5 mb-5 fade-in-content">
        <h2 className="fw-bold mb-4 text-dark d-flex align-items-center">
          <LayoutDashboard className="text-primary me-3" size={32} />
          Dashboard
        </h2>
        <div className="card shadow-sm border-0 p-4 rounded-4 bg-white">
          {adminError && <div className="alert alert-danger py-2 small">{adminError}</div>}
          {adminSuccess && <div className="alert alert-success py-2 small">{adminSuccess}</div>}
          {loadingAdmin ? (
            <div className="text-center py-5">
              <div className="loader-spinner mb-3"></div>
              <p className="text-muted mb-0">Loading dashboard...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Account</th>
                    <th>Role</th>
                    <th className="text-center">Properties</th>
                    <th className="text-center">Services</th>
                    <th className="text-center">Jobs</th>
                    <th className="text-center">Total Added</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminsList.map(user => {
                    const propertyCount = adminActivityListings.properties.filter(item => item.userId === user.userId).length;
                    const serviceCount = adminActivityListings.services.filter(item => item.userId === user.userId).length;
                    const jobCount = adminActivityListings.jobs.filter(item => item.userId === user.userId).length;

                    return (
                      <tr
                        key={user.userId}
                        onClick={() => setSelectedActivityUser(user)}
                        style={{ cursor: 'pointer' }}
                        title="View added listings"
                      >
                        <td>
                          <div className="fw-semibold">{user.fullName}</div>
                          <small className="text-muted">{user.email}</small>
                        </td>
                        <td>
                          <span className={`badge ${user.role === 'subadmin' ? 'bg-primary' : 'bg-secondary'}`}>
                            {user.role === 'subadmin' ? 'Sub-Admin' : user.role}
                          </span>
                        </td>
                        <td className="text-center">{propertyCount}</td>
                        <td className="text-center">{serviceCount}</td>
                        <td className="text-center">{jobCount}</td>
                        <td className="text-center fw-bold">{propertyCount + serviceCount + jobCount}</td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center"
                            disabled={adminAction === `user-${user.userId}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleManagedUserDelete(user);
                            }}
                          >
                            <Trash2 size={14} className="me-1" />
                            {adminAction === `user-${user.userId}` ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {adminsList.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-4">No user or sub-admin accounts found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {selectedActivityUser && (
          <div className="modal fade show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title fw-bold text-dark">{selectedActivityUser.fullName}'s Added Listings</h5>
                    <small className="text-muted">{selectedActivityUser.email}</small>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setSelectedActivityUser(null)}></button>
                </div>
                <div className="modal-body p-4">
                  {[
                    {
                      title: 'Properties',
                      type: 'property',
                      icon: Building,
                      items: adminActivityListings.properties.filter(item => item.userId === selectedActivityUser.userId),
                      getKey: item => item.propertyId,
                      getTitle: item => item.title,
                      getDetail: item => `${item.location} - $${item.price}`
                    },
                    {
                      title: 'Services',
                      type: 'service',
                      icon: Wrench,
                      items: adminActivityListings.services.filter(item => item.userId === selectedActivityUser.userId),
                      getKey: item => item.homeServiceId,
                      getTitle: item => item.title,
                      getDetail: item => `${item.location} - $${item.price}/hr`
                    },
                    {
                      title: 'Jobs',
                      type: 'job',
                      icon: Briefcase,
                      items: adminActivityListings.jobs.filter(item => item.userId === selectedActivityUser.userId),
                      getKey: item => item.jobId,
                      getTitle: item => item.jobTitle,
                      getDetail: item => `${item.location} - ${item.companyName}`
                    }
                  ].map(({ title, type, icon: Icon, items, getKey, getTitle, getDetail }) => (
                    <section className="mb-4" key={title}>
                      <h6 className="fw-bold text-dark d-flex align-items-center mb-3">
                        <Icon size={17} className="text-primary me-2" />
                        {title} ({items.length})
                      </h6>
                      {items.length > 0 ? (
                        <div className="list-group">
                          {items.map(item => (
                            <div className="list-group-item border rounded-3 mb-2" key={getKey(item)}>
                              <div className="d-flex justify-content-between align-items-start gap-3">
                                <div>
                                  <div className="fw-semibold text-dark">{getTitle(item)}</div>
                                  <small className="text-muted">{getDetail(item)}</small>
                                  <div className="small mt-1">Status: {getServiceVerificationLabel(item.verificationStatus)}</div>
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger d-inline-flex align-items-center flex-shrink-0"
                                  disabled={adminAction === `${type}-${getKey(item)}`}
                                  onClick={() => handleListingDelete(type, item)}
                                >
                                  <Trash2 size={14} className="me-1" />
                                  {adminAction === `${type}-${getKey(item)}` ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted small">No {title.toLowerCase()} added.</p>
                      )}
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div >
      
      <HeroSection
        onExploreProperties={() => { setFilters({ query: '', location: '' }); setActivePage('properties'); }}
        onExploreServices={() => { setFilters({ query: '', location: '' }); setActivePage('services'); }}
      />

      
      <div className="container-fluid px-4 px-lg-5 mb-5">
        <div className="row g-4 text-center">
          <div className="col-md-4">
            <div className="p-4 rounded-4 shadow-sm border bg-white h-100 transition-all hover-bg-light">
              <div className="bg-primary-subtle text-primary p-3 rounded-circle d-inline-block mb-3">
                <ShieldCheck size={28} />
              </div>
              <h5 className="fw-bold">100% Verified Listings</h5>
              <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                Every single property and provider undergoes a strict check to guarantee safety and transparency.
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-4 rounded-4 shadow-sm border bg-white h-100 transition-all hover-bg-light">
              <div className="bg-secondary-subtle text-secondary p-3 rounded-circle d-inline-block mb-3">
                <Sparkles size={28} />
              </div>
              <h5 className="fw-bold">Premium Quality</h5>
              <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                Our listings represent standard to luxury options curated carefully for your comfort and style.
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-4 rounded-4 shadow-sm border bg-white h-100 transition-all hover-bg-light">
              <div className="bg-success-subtle text-success p-3 rounded-circle d-inline-block mb-3">
                <CheckCircle size={28} />
              </div>
              <h5 className="fw-bold">Instant Connections</h5>
              <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                Connect directly with property owners and qualified service experts. No middleman fees.
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="container-fluid px-4 px-lg-5 text-center py-5">
          <div className="loader-spinner mb-3"></div>
          <p className="text-muted fw-semibold">Loading top listings...</p>
        </div>
      ) : (
        <>
          
          <div className="container-fluid px-4 px-lg-5 mb-5">
            <div className="d-flex justify-content-between align-items-end mb-4">
              <div>
                <h2 className="fw-bold mb-1 text-dark d-flex align-items-center">
                  <Building className="text-primary me-2" size={26} />
                  Featured Properties
                </h2>
                <p className="text-muted mb-0">Handpicked luxury and family residences ready for you.</p>
              </div>
              <button
                onClick={() => { setFilters({ query: '', location: '' }); setActivePage('properties'); }}
                className="btn btn-link text-primary fw-semibold d-flex align-items-center text-decoration-none"
              >
                View All Properties
                <ArrowRight size={16} className="ms-1" />
              </button>
            </div>

            <div className="row g-4">
              {properties.map(property => (
                <div className="col-12 col-md" key={property.propertyId}>
                  <PropertyCard
                    property={property}
                    onView={(id) => {
                      navigate(`/properties/${id}`);
                    }}
                  />
                </div>
              ))}
              {properties.length === 0 && (
                <div className="col-12 text-center py-5 rounded-4 bg-white border">
                  <p className="text-muted">No properties found. List the first one in the Dashboard!</p>
                </div>
              )}
            </div>
          </div>

          
          <div className="container-fluid px-4 px-lg-5 mb-5">
            <div className="d-flex justify-content-between align-items-end mb-4">
              <div>
                <h2 className="fw-bold mb-1 text-dark d-flex align-items-center">
                  <Wrench className="text-secondary me-2" size={26} />
                  Verified Services
                </h2>
                <p className="text-muted mb-0">Expert care for your cleaning, plumbing, and wiring needs.</p>
              </div>
              <button
                onClick={() => { setFilters({ query: '', location: '' }); setActivePage('services'); }}
                className="btn btn-link text-secondary fw-semibold d-flex align-items-center text-decoration-none"
              >
                Browse All Services
                <ArrowRight size={16} className="ms-1" />
              </button>
            </div>

            <div className="row g-4">
              {services.map(service => (
                <div className="col-12 col-md" key={service.homeServiceId}>
                  <ServiceCard
                    service={service}
                    onView={(id) => {
                      navigate(`/services/${id}`);
                    }}
                  />
                </div>
              ))}
              {services.length === 0 && (
                <div className="col-12 text-center py-5 rounded-4 bg-white border">
                  <p className="text-muted">No services registered. List the first service in the Dashboard!</p>
                </div>
              )}
            </div>
          </div>

          
          <div className="container-fluid px-4 px-lg-5 mb-5">
            <div className="d-flex justify-content-between align-items-end mb-4">
              <div>
                <h2 className="fw-bold mb-1 text-dark d-flex align-items-center">
                  <Briefcase className="text-success me-2" size={26} />
                  Latest Jobs
                </h2>
                <p className="text-muted mb-0">Discover exciting career opportunities.</p>
              </div>
              <button
                onClick={() => { setFilters({ query: '', location: '' }); setActivePage('jobs'); }}
                className="btn btn-link text-success fw-semibold d-flex align-items-center text-decoration-none"
              >
                Browse All Jobs
                <ArrowRight size={16} className="ms-1" />
              </button>
            </div>

            <div className="row g-4">
              {jobs.map(job => (
                <div className="col-12 col-md" key={job.jobId}>
                  <JobCard
                    job={job}
                    onView={(id) => {
                      navigate(`/jobs/${id}`);
                    }}
                  />
                </div>
              ))}
              {jobs.length === 0 && (
                <div className="col-12 text-center py-5 rounded-4 bg-white border">
                  <p className="text-muted">No jobs posted yet. Check back soon!</p>
                </div>
              )}
            </div>
          </div>

        </>
      )}

      
      <div className="container-fluid px-4 px-lg-5 mt-5 mb-5">
        <div className="card shadow-sm border-0 rounded-4 bg-primary-subtle text-dark p-4">
          <div>
            <h4 className="fw-bold mb-2">Wanna add a job? or list a property?</h4>
            <p className="mb-0 text-muted">
              Contact the admin directly to ask about listings, approvals, or account help.
            </p>
            <div className="d-flex flex-column flex-sm-row gap-2 gap-sm-4 mt-3">
              {adminContact?.email && (
                <a href={`mailto:${adminContact.email}`} className="text-dark text-decoration-none fw-semibold d-flex align-items-center">
                  <Mail size={18} className="me-2 text-primary" />
                  {adminContact.email}
                </a>
              )}
              {adminContact?.phoneNumber && (
                <a href={`tel:${adminContact.phoneNumber}`} className="text-dark text-decoration-none fw-semibold d-flex align-items-center">
                  <PhoneCall size={18} className="me-2 text-primary" />
                  {adminContact.phoneNumber}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
