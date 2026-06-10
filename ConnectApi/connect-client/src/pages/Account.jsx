import { useState, useEffect } from 'react';
import { useUser } from '../context/useUser';
import * as propertyApi from '../services/propertyServices';
import * as serviceApi from '../services/servicesServices';
import * as userApi from '../services/userServices';
import * as jobApi from '../services/jobServices';

import PropertyCard from '../components/PropertyCard';
import ServiceCard from '../components/ServiceCard';
import JobCard from '../components/JobCard';
import PropertyForm from '../components/PropertyForm';
import ServiceForm from '../components/ServiceForm';
import JobForm from '../components/JobForm';
import { User, Key, Building, Wrench, Briefcase, LogOut, Mail, Phone, ShieldCheck, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { getServiceVerificationLabel, SERVICE_VERIFICATION } from '../utils/serviceVerification';
import {
  hasText,
  isValidEmail,
  isValidLebanesePhone,
  formatLebanesePhone,
  getLebanesePhoneDigits
} from '../utils/formValidation';
import { getApiErrorMessage } from '../utils/apiError';
import { readImageFileAsDataUrl } from '../utils/imageFile';

const Account = ({ onViewProperty, onViewService, onViewJob, setActivePage, activeSubTab: propActiveSubTab, setActiveSubTab: propSetActiveSubTab }) => {
  const { currentUser, updateUser, logout } = useUser();
  const isModerator = currentUser?.role === 'admin' || currentUser?.role === 'subadmin';
  const [localActiveSubTab, setLocalActiveSubTab] = useState('profile');

  const activeSubTab = propActiveSubTab || localActiveSubTab;
  const setActiveSubTab = propSetActiveSubTab || setLocalActiveSubTab;

  const [properties, setProperties] = useState([]);
  const [services, setServices] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [adminProperties, setAdminProperties] = useState([]);
  const [adminServices, setAdminServices] = useState([]);
  const [adminJobs, setAdminJobs] = useState([]);
  const [loadingAdminApprovals, setLoadingAdminApprovals] = useState(false);
  const [adminApprovalError, setAdminApprovalError] = useState('');
  const [adminApprovalActionId, setAdminApprovalActionId] = useState(null);

  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showAddChoiceModal, setShowAddChoiceModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [editingJob, setEditingJob] = useState(null);

  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    imageUrl: '',
  });
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileImageName, setProfileImageName] = useState('');

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [adminData, setAdminData] = useState({ fullName: '', email: '', password: '', phoneNumber: '' });
  const [adminSuccess, setAdminSuccess] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminSaving, setAdminSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setProfileData({
        fullName: currentUser.fullName,
        email: currentUser.email,
        phoneNumber: getLebanesePhoneDigits(currentUser.phoneNumber || ''),
        imageUrl: currentUser.imageUrl || '',
      });
      loadUserListings();
      if (currentUser.role === 'admin' || currentUser.role === 'subadmin') {
        loadAdminApprovals();
      }
    }
  }, [currentUser]);

  const loadUserListings = () => {
    if (!currentUser) return;
    setLoadingListings(true);
    return Promise.all([
      propertyApi.getAll({ userId: currentUser.userId }),
      serviceApi.getAll({ userId: currentUser.userId }),
      jobApi.getAll({ userId: currentUser.userId })
    ])
      .then(([propsData, svcsData, jobsData]) => {
        setProperties(propsData);
        setServices(svcsData);
        setJobs(jobsData);
      })
      .catch(err => console.error("Error loading user listings:", err))
      .finally(() => setLoadingListings(false));
  };

  const loadAdminApprovals = () => {
    setLoadingAdminApprovals(true);
    setAdminApprovalError('');
    return Promise.all([
      propertyApi.getAll({ includeUnverified: true }),
      serviceApi.getAll({ includeUnverified: true }),
      jobApi.getAll({ includeUnverified: true })
    ])
      .then(([propsData, svcsData, jobsData]) => {
        const hideAccepted = (listing) =>
          listing.verificationStatus !== SERVICE_VERIFICATION.verified;

        setAdminProperties(propsData.filter(hideAccepted));
        setAdminServices(svcsData.filter(hideAccepted));
        setAdminJobs(jobsData.filter(hideAccepted));
      })
      .catch(err => {
        console.error("Error loading admin reviews:", err);
        setAdminApprovalError('Failed to load submitted listings for admin review.');
      })
      .finally(() => setLoadingAdminApprovals(false));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    if (!hasText(profileData.fullName) || !hasText(profileData.email) || !hasText(profileData.phoneNumber)) {
      setProfileError('Full name, email, and phone number are required.');
      return;
    }
    if (!isValidEmail(profileData.email)) {
      setProfileError('Enter a valid email address.');
      return;
    }
    if (!isValidLebanesePhone(profileData.phoneNumber)) {
      setProfileError('Phone number must be exactly 8 digits after +961.');
      return;
    }
    const updatedUser = {
      ...currentUser,
      fullName: profileData.fullName.trim(),
      email: profileData.email.trim(),
      phoneNumber: formatLebanesePhone(profileData.phoneNumber),
      imageUrl: profileData.imageUrl.trim()
    };

    const hasChanges = 
      currentUser.fullName !== updatedUser.fullName ||
      currentUser.email !== updatedUser.email ||
      (currentUser.phoneNumber || '') !== updatedUser.phoneNumber ||
      (currentUser.imageUrl || '') !== updatedUser.imageUrl;

    if (!hasChanges) {
      setProfileSuccess('');
      return;
    }

    setProfileSaving(true);

    try {
      await updateUser(currentUser.userId, updatedUser);
      setProfileSuccess('Profile details updated successfully!');
    } catch (err) {
      setProfileError(getApiErrorMessage(err, 'Failed to update profile.'));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleProfileImageChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const imageUrl = await readImageFileAsDataUrl(file);
      setProfileData({ ...profileData, imageUrl });
      setProfileImageName(file.name);
      setProfileError('');
    } catch (err) {
      setProfileError(err.message);
      event.target.value = '';
    }
  };

  const handleRemoveProfileImage = () => {
    setProfileData({ ...profileData, imageUrl: '' });
    setProfileImageName('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All password fields are required.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }

    setPasswordSaving(true);
    try {
      await userApi.changePassword(currentUser.userId, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordSuccess('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(getApiErrorMessage(err, 'Failed to update password.'));
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminSuccess('');
    setAdminError('');

    if (!hasText(adminData.fullName) || !hasText(adminData.email) || !hasText(adminData.password) || !hasText(adminData.phoneNumber)) {
      setAdminError('All fields are required.');
      return;
    }

    if (!isValidEmail(adminData.email)) {
      setAdminError('Enter a valid email address.');
      return;
    }

    if (adminData.password.length < 8) {
      setAdminError('Password must be at least 8 characters.');
      return;
    }

    if (!isValidLebanesePhone(adminData.phoneNumber)) {
      setAdminError('Phone number must be exactly 8 digits after +961.');
      return;
    }

    setAdminSaving(true);
    try {
      await userApi.createSubAdmin({
        adminId: currentUser.userId,
        fullName: adminData.fullName.trim(),
        email: adminData.email.trim(),
        password: adminData.password,
        phoneNumber: formatLebanesePhone(adminData.phoneNumber)
      });
      setAdminSuccess(`Sub-admin account "${adminData.email}" registered successfully!`);
      setAdminData({ fullName: '', email: '', password: '', phoneNumber: '' });
    } catch (err) {
      setAdminError(getApiErrorMessage(err, 'Failed to create sub-admin account.'));
    } finally {
      setAdminSaving(false);
    }
  };

  const handlePropertySave = async (propertyData) => {
    if (propertyData.propertyId) {
      await propertyApi.update(propertyData.propertyId, propertyData);
    } else {
      await propertyApi.create(propertyData);
    }
    setShowPropertyForm(false);
    setEditingProperty(null);
    loadUserListings();
  };

  const handleServiceSave = async (serviceData) => {
    if (serviceData.homeServiceId) {
      await serviceApi.update(serviceData.homeServiceId, serviceData);
    } else {
      await serviceApi.create(serviceData);
    }
    setShowServiceForm(false);
    setEditingService(null);
    loadUserListings();
  };

  const handleJobSave = async (jobData) => {
    if (jobData.jobId) {
      await jobApi.update(jobData.jobId, jobData);
    } else {
      await jobApi.create(jobData);
    }
    setShowJobForm(false);
    setEditingJob(null);
    loadUserListings();
  };

  const handlePropertyDelete = async (id) => {
    if (window.confirm("Delete this listing?")) {
      await propertyApi.remove(id, currentUser.userId);
      loadUserListings();
    }
  };

  const handleServiceDelete = async (id) => {
    if (window.confirm("Delete this service?")) {
      await serviceApi.remove(id, currentUser.userId);
      loadUserListings();
    }
  };

  const handleJobDelete = async (id) => {
    if (window.confirm("Delete this job?")) {
      await jobApi.remove(id, currentUser.userId);
      loadUserListings();
    }
  };

  const handleVerificationAction = async (type, id, verificationStatus) => {
    setAdminApprovalActionId(id);
    setAdminApprovalError('');
    try {
      if (type === 'service') {
        await serviceApi.updateVerificationStatus(id, verificationStatus, currentUser.userId);
      } else if (type === 'property') {
        await propertyApi.updateVerificationStatus(id, verificationStatus, currentUser.userId);
      } else if (type === 'job') {
        await jobApi.updateVerificationStatus(id, verificationStatus, currentUser.userId);
      }
      await Promise.all([
        loadAdminApprovals(),
        loadUserListings(),
      ]);
    } catch (err) {
      console.error(`Failed to update ${type} verification:`, err);
      setAdminApprovalError(getApiErrorMessage(
        err,
        `Failed to update ${type} verification status.`
      ));
    } finally {
      setAdminApprovalActionId(null);
    }
  };

  if (!currentUser) {
    return (
      <div className="container py-5 text-center fade-in-content">
        <div className="alert alert-danger py-4 rounded-4" role="alert">
          <AlertCircle className="mb-2 text-danger" size={36} />
          <h4 className="fw-bold">Access Denied</h4>
          <p className="mb-0">Please log in to access the Account page.</p>
        </div>
      </div>
    );
  }

  const handleLogoutClick = () => {
    logout();
    setActivePage('home');
  };

  return (
    <div className="container fade-in-content mb-5" >
      <div className="row g-4">
        <div className="col-lg-3 align-items-center">
          <div className="card border-0 shadow-sm rounded-4 p-4 text-center bg-dark text-white position-relative overflow-hidden mb-4">
            <div className="position-absolute bg-primary rounded-circle opacity-10" style={{ width: '100px', height: '100px', top: '-25px', right: '-25px', filter: 'blur(20px)' }}></div>
            
            <div className="d-flex justify-content-center mb-3">
              {currentUser.imageUrl ? (
                <img 
                  src={currentUser.imageUrl} 
                  alt={currentUser.fullName} 
                  className="rounded-circle shadow object-fit-cover" 
                  style={{ width: '72px', height: '72px', border: '3px solid rgba(255, 255, 255, 0.15)' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="bg-primary text-white p-3 rounded-circle shadow">
                  <User size={36} />
                </div>
              )}
            </div>
            
            <h5 className="fw-bold mb-1 text-white">{currentUser.fullName}</h5>
           

            <div className="text-start border-top border-secondary pt-3 mt-2 text-white-50" style={{ fontSize: '0.85rem' }}>
              <div className="d-flex align-items-center mb-2 text-truncate">
                <Mail size={14} className="me-2 text-secondary flex-shrink-0" />
                <span className="text-truncate">{currentUser.email}</span>
              </div>
              {currentUser.phoneNumber && (
                <div className="d-flex align-items-center">
                  <Phone size={14} className="me-2 text-secondary flex-shrink-0" />
                  <span>{currentUser.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>

          <div className="list-group shadow-sm border-0 rounded-4 overflow-hidden">
            <button
              onClick={() => { setActiveSubTab('profile'); setShowPropertyForm(false); setShowServiceForm(false); }}
              className={`list-group-item list-group-item-action border-0 py-3 d-flex align-items-center px-4 transition-all ${
                activeSubTab === 'profile' ? 'bg-primary-subtle text-dark' : 'text-dark'
              }`}
              style={{ fontWeight: activeSubTab === 'profile' ? '600' : '500' }}
            >
              <User size={18} className="me-3" />
              Profile Details
            </button>
            <button
              onClick={() => { setActiveSubTab('security'); setShowPropertyForm(false); setShowServiceForm(false); }}
              className={`list-group-item list-group-item-action border-0 py-3 d-flex align-items-center px-4 transition-all ${
                activeSubTab === 'security' ? 'bg-primary-subtle text-dark' : 'text-dark'
              }`}
              style={{ fontWeight: activeSubTab === 'security' ? '600' : '500' }}
            >
              <Key size={18} className="me-3" />
              Security & Password
            </button>
            {currentUser.role === 'user' && (
              <>
                <button
                  onClick={() => { setActiveSubTab('properties'); setShowJobForm(false); setShowPropertyForm(false); setShowServiceForm(false); }}
                  className={`list-group-item list-group-item-action border-0 py-3 d-flex align-items-center px-4 transition-all ${
                    activeSubTab === 'properties' ? 'bg-primary-subtle text-dark' : 'text-dark'
                  }`}
                  style={{ fontWeight: activeSubTab === 'properties' ? '600' : '500' }}
                >
                  <Building size={18} className="me-3" />
                  Properties ({properties.length})
                </button>
                <button
                  onClick={() => { setActiveSubTab('services'); setShowJobForm(false); setShowPropertyForm(false); setShowServiceForm(false); }}
                  className={`list-group-item list-group-item-action border-0 py-3 d-flex align-items-center px-4 transition-all ${
                    activeSubTab === 'services' ? 'bg-primary-subtle text-dark' : 'text-dark'
                  }`}
                  style={{ fontWeight: activeSubTab === 'services' ? '600' : '500' }}
                >
                  <Wrench size={18} className="me-3" />
                  Services ({services.length})
                </button>
              </>
            )}
            {currentUser.role === 'company' && (
              <button
                onClick={() => { setActiveSubTab('jobs'); setShowJobForm(false); setShowPropertyForm(false); setShowServiceForm(false); }}
                className={`list-group-item list-group-item-action border-0 py-3 d-flex align-items-center px-4 transition-all ${
                  activeSubTab === 'jobs' ? 'bg-primary-subtle text-dark' : 'text-dark'
                }`}
                style={{ fontWeight: activeSubTab === 'jobs' ? '600' : '500' }}
              >
                <Briefcase size={18} className="me-3" />
                Jobs ({jobs.length})
              </button>
            )}
            {isModerator && (
              <>
                <button
                  onClick={() => { setActiveSubTab('properties'); setShowJobForm(false); setShowPropertyForm(false); setShowServiceForm(false); }}
                  className={`list-group-item list-group-item-action border-0 py-3 d-flex align-items-center px-4 transition-all ${
                    activeSubTab === 'properties' ? 'bg-primary-subtle text-dark' : 'text-dark'
                  }`}
                  style={{ fontWeight: activeSubTab === 'properties' ? '600' : '500' }}
                >
                  <Building size={18} className="me-3" />
                  Properties ({properties.length})
                </button>
                <button
                  onClick={() => { setActiveSubTab('jobs'); setShowJobForm(false); setShowPropertyForm(false); setShowServiceForm(false); }}
                  className={`list-group-item list-group-item-action border-0 py-3 d-flex align-items-center px-4 transition-all ${
                    activeSubTab === 'jobs' ? 'bg-primary-subtle text-dark' : 'text-dark'
                  }`}
                  style={{ fontWeight: activeSubTab === 'jobs' ? '600' : '500' }}
                >
                  <Briefcase size={18} className="me-3" />
                  Jobs ({jobs.length})
                </button>
                <button
                  onClick={() => { setActiveSubTab('services'); setShowJobForm(false); setShowPropertyForm(false); setShowServiceForm(false); }}
                  className={`list-group-item list-group-item-action border-0 py-3 d-flex align-items-center px-4 transition-all ${
                    activeSubTab === 'services' ? 'bg-primary-subtle text-dark' : 'text-dark'
                  }`}
                  style={{ fontWeight: activeSubTab === 'services' ? '600' : '500' }}
                >
                  <Wrench size={18} className="me-3" />
                  Services ({services.length})
                </button>
              </>
            )}
            {isModerator && (
              <button
                onClick={() => { setActiveSubTab('approvals'); setShowPropertyForm(false); setShowServiceForm(false); }}
                className={`list-group-item list-group-item-action border-0 py-3 d-flex align-items-center px-4 transition-all ${
                  activeSubTab === 'approvals' ? 'bg-primary-subtle text-dark' : 'text-dark'
                }`}
                style={{ fontWeight: activeSubTab === 'approvals' ? '600' : '500' }}
              >
                <ShieldCheck size={18} className="me-3" />
                Pending Approvals ({adminProperties.length + adminServices.length + adminJobs.length})
              </button>
            )}
            {currentUser.role === 'admin' && (
              <button
                onClick={() => { setActiveSubTab('admin'); setShowPropertyForm(false); setShowServiceForm(false); }}
                className={`list-group-item list-group-item-action border-0 py-3 d-flex align-items-center px-4 transition-all ${
                  activeSubTab === 'admin' ? 'bg-primary-subtle text-dark' : 'text-dark'
                }`}
                style={{ fontWeight: activeSubTab === 'admin' ? '600' : '500' }}
              >
                <ShieldCheck size={18} className="me-3" />
                Add Sub-Admin
              </button>
            )}
            <button
              onClick={handleLogoutClick}
              className="list-group-item list-group-item-action border-0 py-3 d-flex align-items-center px-4 text-danger transition-all"
              style={{ fontWeight: '500' }}
            >
              <LogOut size={18} className="me-3" />
              Log Out
            </button>
          </div>
        </div>

        
        <div className="col-lg-9">
          
          {activeSubTab === 'profile' && (
            <div className="card form-modern p-4 fade-in-content">
              <h4 className="fw-bold mb-4 text-dark d-flex align-items-center">
                <User className="text-primary me-2" />
                Profile Details
              </h4>

              {profileSuccess && <div className="alert alert-success d-flex align-items-center py-2 px-3 mb-3"><CheckCircle2 size={16} className="me-2" />{profileSuccess}</div>}
              {profileError && <div className="alert alert-danger d-flex align-items-center py-2 px-3 mb-3"><AlertCircle size={16} className="me-2" />{profileError}</div>}

              <form onSubmit={handleProfileSubmit}>
                <div className="mb-4">
                  <div className="form-floating">
                    <input
                      type="text"
                      id="profileFullName"
                      className="form-control bg-light"
                      placeholder="Full Name"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      required
                    />
                    <label htmlFor="profileFullName">Full Name *</label>
                  </div>
                  <div className="form-text text-muted small mt-1">This is how your name will appear to others.</div>
                </div>
                <div className="mb-4">
                  <div className="form-floating">
                    <input
                      type="email"
                      id="profileEmail"
                      className="form-control bg-light"
                      placeholder="Email Address"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      required
                    />
                    <label htmlFor="profileEmail">Email Address *</label>
                  </div>
                  <div className="form-text text-muted small mt-1">We will never share your email with anyone else.</div>
                </div>
                <div className="mb-4">
                  <label htmlFor="profilePhone" className="form-label fw-semibold small text-muted">Phone Number *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light fw-semibold">+961</span>
                    <input
                      type="tel"
                      id="profilePhone"
                      className="form-control bg-light"
                      placeholder="70123456"
                      value={profileData.phoneNumber}
                      maxLength="8"
                      inputMode="numeric"
                      onChange={(e) => setProfileData({ ...profileData, phoneNumber: getLebanesePhoneDigits(e.target.value).slice(0, 8) })}
                      required
                    />
                  </div>
                  <div className="form-text text-muted small mt-1">Enter 8 digits only. We will save it as +961 followed by your number.</div>
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold text-muted small">Profile Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control bg-light"
                    onChange={handleProfileImageChange}
                  />
                  {profileImageName && <small className="text-muted d-block mt-1">Selected file: {profileImageName}</small>}
                  {profileData.imageUrl && (
                    <div className="glass-panel rounded-4 p-3 mt-3">
                      <img src={profileData.imageUrl} alt="Profile preview" className="rounded-circle object-fit-cover shadow-sm" style={{ width: '96px', height: '96px' }} />
                      <div className="mt-3">
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleRemoveProfileImage}>Remove image</button>
                      </div>
                    </div>
                  )}
                  <div className="form-text text-muted small mt-1">Upload a clear photo for better trust.</div>
                </div>
                <button type="submit" className="btn btn-premium px-4" disabled={profileSaving}>
                  {profileSaving ? 'Saving...' : 'Save Profile Settings'}
                </button>
              </form>
            </div>
          )}

          
          {activeSubTab === 'security' && (
            <div className="card form-modern p-4 fade-in-content">
              <h4 className="fw-bold mb-4 text-dark d-flex align-items-center">
                <Key className="text-primary me-2" />
                Security & Password Settings
              </h4>

              {passwordSuccess && <div className="alert alert-success d-flex align-items-center py-2 px-3 mb-3"><CheckCircle2 size={16} className="me-2" />{passwordSuccess}</div>}
              {passwordError && <div className="alert alert-danger d-flex align-items-center py-2 px-3 mb-3"><AlertCircle size={16} className="me-2" />{passwordError}</div>}

              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-4">
                  <div className="form-floating">
                    <input
                      type="password"
                      id="currentPassword"
                      className="form-control bg-light"
                      placeholder="Current Password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                    />
                    <label htmlFor="currentPassword">Current Password *</label>
                  </div>
                  <div className="form-text text-muted small mt-1">Verify your identity with your old password.</div>
                </div>
                <div className="mb-4">
                  <div className="form-floating">
                    <input
                      type="password"
                      id="newPassword"
                      className="form-control bg-light"
                      placeholder="New Password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      minLength="8"
                      required
                    />
                    <label htmlFor="newPassword">New Password *</label>
                  </div>
                  <div className="form-text text-muted small mt-1">Make it strong! Use at least 8 characters.</div>
                </div>
                <div className="mb-4">
                  <div className="form-floating">
                    <input
                      type="password"
                      id="confirmPassword"
                      className="form-control bg-light"
                      placeholder="Confirm New Password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      minLength="8"
                      required
                    />
                    <label htmlFor="confirmPassword">Confirm New Password *</label>
                  </div>
                  <div className="form-text text-muted small mt-1">Please re-type your new password accurately.</div>
                </div>
                <button type="submit" className="btn btn-premium px-4" disabled={passwordSaving}>
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          
          {activeSubTab === 'properties' && (
            <>
              {showPropertyForm ? (
                <PropertyForm 
                  property={editingProperty}
                  onSave={handlePropertySave}
                  onCancel={() => { setShowPropertyForm(false); setEditingProperty(null); }}
                />
              ) : (
                <div className="card form-modern p-4 fade-in-content">
                  <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                    <h4 className="fw-bold mb-0 text-dark d-flex align-items-center">
                      <Building className="text-primary me-2" />
                      Properties
                    </h4>
                <button onClick={() => setShowPropertyForm(true)} className="btn btn-premium btn-sm d-flex align-items-center">
                      <Plus className="me-1" size={16} /> List Property
                    </button>
                  </div>

                  <div className="alert alert-info py-3 px-3 rounded-4 mb-4">
                    New and edited properties stay in <strong>In Progress</strong> until an admin reviews them. If a property is rejected, it will show <strong>Not Accepted</strong> until you edit and submit it again.
                  </div>

                  {loadingListings ? (
                    <div className="text-center py-5">
                      <div className="loader-spinner mb-3"></div>
                      <p className="text-muted">Loading your properties...</p>
                    </div>
                  ) : (
                    <div className="row g-4">
                      {properties.map(property => (
                        <div className="col-md-6" key={property.propertyId}>
                          <PropertyCard 
                            property={property} 
                            onView={onViewProperty}
                            onEdit={(prop) => { setEditingProperty(prop); setShowPropertyForm(true); }}
                            onDelete={handlePropertyDelete}
                            showActions={true}
                            showVerificationStatus={true}
                          />
                        </div>
                      ))}
                      {properties.length === 0 && (
                        <div className="col-12 text-center py-5">
                          <Building size={48} className="text-muted mb-2 opacity-50" />
                          <h6 className="fw-bold">No Properties Listed</h6>
                          <p className="text-muted small">You haven't listed any properties yet. Click "List Property" to add one.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          
          {activeSubTab === 'services' && (
            <>
              {showServiceForm ? (
                <ServiceForm 
                  service={editingService}
                  onSave={handleServiceSave}
                  onCancel={() => { setShowServiceForm(false); setEditingService(null); }}
                />
              ) : (
                <div className="card form-modern p-4 fade-in-content">
                  <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                    <h4 className="fw-bold mb-0 text-dark d-flex align-items-center">
                      <Wrench className="text-primary me-2" />
                      Services
                    </h4>
                    <button 
                      onClick={() => setShowServiceForm(true)} 
                      className="btn btn-premium btn-sm d-flex align-items-center"
                    >
                      <Plus className="me-1" size={16} /> Register Service
                    </button>
                  </div>

                  <div className="alert alert-info py-3 px-3 rounded-4 mb-4">
                    New and edited services stay in <strong>In Progress</strong> until an admin reviews them. If a service is rejected, it will show <strong>Not Accepted</strong> until you edit and submit it again.
                  </div>

                  {loadingListings ? (
                    <div className="text-center py-5">
                      <div className="loader-spinner mb-3"></div>
                      <p className="text-muted">Loading your services...</p>
                    </div>
                  ) : (
                    <div className="row g-4">
                      {services.map(service => (
                        <div className="col-md-6" key={service.homeServiceId}>
                          <ServiceCard 
                            service={service} 
                            onView={onViewService}
                            onEdit={(svc) => { setEditingService(svc); setShowServiceForm(true); }}
                            onDelete={handleServiceDelete}
                            showActions={true}
                            showVerificationStatus={true}
                          />
                        </div>
                      ))}
                      {services.length === 0 && (
                        <div className="col-12 text-center py-5">
                          <Wrench size={48} className="text-muted mb-2 opacity-50" />
                          <h6 className="fw-bold">No Services Registered</h6>
                          <p className="text-muted small">You haven't listed any services yet. Click "Register Service" to start.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          
          {activeSubTab === 'jobs' && ['admin', 'subadmin', 'company'].includes(currentUser.role) && (
            <>
              {showJobForm ? (
                <JobForm 
                  job={editingJob}
                  onSave={handleJobSave}
                  onCancel={() => { setShowJobForm(false); setEditingJob(null); }}
                />
              ) : (
                <div className="card form-modern p-4 fade-in-content">
                  <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                    <h4 className="fw-bold mb-0 text-dark d-flex align-items-center">
                      <Briefcase className="text-primary me-2" />
                      Jobs
                    </h4>
                    <button onClick={() => setShowJobForm(true)} className="btn btn-premium btn-sm d-flex align-items-center">
                      <Plus className="me-1" size={16} /> Post Job
                    </button>
                  </div>

                  <div className="alert alert-info py-3 px-3 rounded-4 mb-4">
                    New and edited jobs stay in <strong>In Progress</strong> until an admin reviews them. If a job is rejected, it will show <strong>Not Accepted</strong> until you edit and submit it again.
                  </div>

                  {loadingListings ? (
                    <div className="text-center py-5">
                      <div className="loader-spinner mb-3"></div>
                      <p className="text-muted">Loading your jobs...</p>
                    </div>
                  ) : (
                    <div className="row g-4">
                      {jobs.map(job => (
                        <div className="col-md-6" key={job.jobId}>
                          <JobCard 
                            job={job} 
                            onView={onViewJob}
                            onEdit={(j) => { setEditingJob(j); setShowJobForm(true); }}
                            onDelete={handleJobDelete}
                            showActions={true}
                            showVerificationStatus={true}
                          />
                        </div>
                      ))}
                      {jobs.length === 0 && (
                        <div className="col-12 text-center py-5">
                          <Briefcase size={48} className="text-muted mb-2 opacity-50" />
                          <h6 className="fw-bold">No Jobs Posted</h6>
                          <p className="text-muted small">You haven't posted any jobs yet. Click "Post Job" to add one.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          
          {activeSubTab === 'approvals' && isModerator && (
            <div className="d-grid gap-4">
              <div className="card form-modern p-4 fade-in-content">
                <h4 className="fw-bold mb-4 text-dark d-flex align-items-center">
                  <ShieldCheck className="text-primary me-2" />
                  Listing Review Queue
                </h4>

                <p className="text-muted mb-4">
                  Every submitted listing starts in <strong>In Progress</strong>. Approve it to make it visible in public browsing, or mark it as <strong>Not Accepted</strong> so the user can revise it.
                </p>

                {adminApprovalError && <div className="alert alert-danger d-flex align-items-center py-2 px-3 mb-3"><AlertCircle size={16} className="me-2" />{adminApprovalError}</div>}

                {loadingAdminApprovals ? (
                  <div className="text-center py-5">
                    <div className="loader-spinner mb-3"></div>
                    <p className="text-muted mb-0">Loading submitted listings...</p>
                  </div>
                ) : (
                  <>
                    
                    <h5 className="fw-bold mt-4 mb-3 d-flex align-items-center"><Building size={18} className="text-primary me-2" /> Properties ({adminProperties.length})</h5>
                    <div className="row g-4 mb-4">
                      {adminProperties.map(property => (
                        <div className="col-md-6" key={property.propertyId}>
                          <div className="card shadow-sm border-0 p-3 rounded-4 bg-white h-100">
                            <PropertyCard property={property} onView={onViewProperty} showVerificationStatus={true} />
                            <div className="d-flex gap-2 mt-3">
                              <button
                                type="button"
                                className="btn btn-sm btn-success flex-grow-1"
                                disabled={adminApprovalActionId === property.propertyId || property.verificationStatus === SERVICE_VERIFICATION.verified}
                                onClick={() => handleVerificationAction('property', property.propertyId, SERVICE_VERIFICATION.verified)}
                              >
                                {adminApprovalActionId === property.propertyId ? 'Saving...' : 'Accept'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger flex-grow-1"
                                disabled={adminApprovalActionId === property.propertyId || property.verificationStatus === SERVICE_VERIFICATION.notAccepted}
                                onClick={() => handleVerificationAction('property', property.propertyId, SERVICE_VERIFICATION.notAccepted)}
                              >
                                {adminApprovalActionId === property.propertyId ? 'Saving...' : 'Not Accepted'}
                              </button>
                            </div>
                            <small className="text-muted d-block mt-2">
                              Current status: {getServiceVerificationLabel(property.verificationStatus)}
                            </small>
                          </div>
                        </div>
                      ))}
                      {adminProperties.length === 0 && (
                        <div className="col-12 text-center py-3">
                          <p className="text-muted small mb-0">No properties waiting for admin review right now.</p>
                        </div>
                      )}
                    </div>

                    
                    <h5 className="fw-bold mt-4 mb-3 d-flex align-items-center"><Briefcase size={18} className="text-primary me-2" /> Jobs ({adminJobs.length})</h5>
                    <div className="row g-4 mb-4">
                      {adminJobs.map(job => (
                        <div className="col-md-6" key={job.jobId}>
                          <div className="card shadow-sm border-0 p-3 rounded-4 bg-white h-100">
                            <JobCard job={job} onView={onViewJob} showVerificationStatus={true} />
                            <div className="d-flex gap-2 mt-3">
                              <button
                                type="button"
                                className="btn btn-sm btn-success flex-grow-1"
                                disabled={adminApprovalActionId === job.jobId || job.verificationStatus === SERVICE_VERIFICATION.verified}
                                onClick={() => handleVerificationAction('job', job.jobId, SERVICE_VERIFICATION.verified)}
                              >
                                {adminApprovalActionId === job.jobId ? 'Saving...' : 'Accept'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger flex-grow-1"
                                disabled={adminApprovalActionId === job.jobId || job.verificationStatus === SERVICE_VERIFICATION.notAccepted}
                                onClick={() => handleVerificationAction('job', job.jobId, SERVICE_VERIFICATION.notAccepted)}
                              >
                                {adminApprovalActionId === job.jobId ? 'Saving...' : 'Not Accepted'}
                              </button>
                            </div>
                            <small className="text-muted d-block mt-2">
                              Current status: {getServiceVerificationLabel(job.verificationStatus)}
                            </small>
                          </div>
                        </div>
                      ))}
                      {adminJobs.length === 0 && (
                        <div className="col-12 text-center py-3">
                          <p className="text-muted small mb-0">No jobs waiting for admin review right now.</p>
                        </div>
                      )}
                    </div>

                    
                    <h5 className="fw-bold mt-4 mb-3 d-flex align-items-center"><Wrench size={18} className="text-primary me-2" /> Services ({adminServices.length})</h5>
                    <div className="row g-4">
                      {adminServices.map(service => (
                        <div className="col-md-6" key={service.homeServiceId}>
                          <div className="card shadow-sm border-0 p-3 rounded-4 bg-white h-100">
                            <ServiceCard service={service} onView={onViewService} showVerificationStatus={true} />
                            <div className="d-flex gap-2 mt-3">
                              <button
                                type="button"
                                className="btn btn-sm btn-success flex-grow-1"
                                disabled={adminApprovalActionId === service.homeServiceId || service.verificationStatus === SERVICE_VERIFICATION.verified}
                                onClick={() => handleVerificationAction('service', service.homeServiceId, SERVICE_VERIFICATION.verified)}
                              >
                                {adminApprovalActionId === service.homeServiceId ? 'Saving...' : 'Accept'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger flex-grow-1"
                                disabled={adminApprovalActionId === service.homeServiceId || service.verificationStatus === SERVICE_VERIFICATION.notAccepted}
                                onClick={() => handleVerificationAction('service', service.homeServiceId, SERVICE_VERIFICATION.notAccepted)}
                              >
                                {adminApprovalActionId === service.homeServiceId ? 'Saving...' : 'Not Accepted'}
                              </button>
                            </div>
                            <small className="text-muted d-block mt-2">
                              Current status: {getServiceVerificationLabel(service.verificationStatus)}
                            </small>
                          </div>
                        </div>
                      ))}
                      {adminServices.length === 0 && (
                        <div className="col-12 text-center py-3">
                          <p className="text-muted small mb-0">No services waiting for admin review right now.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          
          {activeSubTab === 'admin' && currentUser.role === 'admin' && (
            <div className="card form-modern p-4 fade-in-content">
              <h4 className="fw-bold mb-4 text-dark d-flex align-items-center">
                <ShieldCheck className="text-primary me-2" />
                Create Sub-Admin Account
              </h4>

              {adminSuccess && <div className="alert alert-success d-flex align-items-center py-2 px-3 mb-3"><CheckCircle2 size={16} className="me-2" />{adminSuccess}</div>}
              {adminError && <div className="alert alert-danger d-flex align-items-center py-2 px-3 mb-3"><AlertCircle size={16} className="me-2" />{adminError}</div>}

              <form onSubmit={handleAdminSubmit}>
                <div className="mb-4">
                  <div className="form-floating">
                    <input type="text" id="adminFullName" className="form-control bg-light" placeholder="Full Name" value={adminData.fullName} onChange={(e) => setAdminData({ ...adminData, fullName: e.target.value })} required />
                    <label htmlFor="adminFullName">Sub-Admin Full Name *</label>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="form-floating">
                    <input type="email" id="adminEmail" className="form-control bg-light" placeholder="Email Address" value={adminData.email} onChange={(e) => setAdminData({ ...adminData, email: e.target.value })} required />
                    <label htmlFor="adminEmail">Sub-Admin Email *</label>
                  </div>
                </div>
                <div className="mb-4">
                  <label htmlFor="adminPhone" className="form-label fw-semibold small text-muted">Phone Number *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light fw-semibold">+961</span>
                    <input
                      type="tel"
                      id="adminPhone"
                      className="form-control bg-light"
                      placeholder="70123456"
                      value={adminData.phoneNumber}
                      maxLength="8"
                      inputMode="numeric"
                      onChange={(e) => setAdminData({ ...adminData, phoneNumber: getLebanesePhoneDigits(e.target.value).slice(0, 8) })}
                      required
                    />
                  </div>
                  <div className="form-text text-muted small mt-1">Enter 8 digits only. We will save it as +961 followed by your number.</div>
                </div>
                <div className="mb-4">
                  <div className="form-floating">
                    <input type="password" id="adminPassword" className="form-control bg-light" placeholder="Password" value={adminData.password} onChange={(e) => setAdminData({ ...adminData, password: e.target.value })} minLength="8" required />
                    <label htmlFor="adminPassword">Sub-Admin Password *</label>
                  </div>
                </div>
                <button type="submit" className="btn btn-premium px-4" disabled={adminSaving}>
                  {adminSaving ? 'Creating...' : 'Register Sub-Admin'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
      
      {showAddChoiceModal && (
        <div className="modal fade show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '450px' }}>
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center">
                  <Plus className="text-primary me-2" />
                  What would you like to list?
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowAddChoiceModal(false)}></button>
              </div>
              <div className="modal-body py-4">
                <div className="row g-3">
                  <div className="col-12">
                    <button 
                      onClick={() => { setShowAddChoiceModal(false); setActiveSubTab('properties'); setShowPropertyForm(true); }}
                      className="btn btn-outline-primary w-100 p-4 rounded-4 text-start d-flex align-items-center transition-all glass-panel hover-bg-light"
                      style={{ border: '2px solid rgba(13, 110, 253, 0.25)' }}
                    >
                      <div className="bg-primary text-white p-3 rounded-3 me-3">
                        <Building size={24} />
                      </div>
                      <div>
                        <h6 className="fw-bold mb-1 text-dark">Real Estate Property</h6>
                        <p className="text-muted small mb-0">List apartments, villas, land, or office spaces for sale/rent.</p>
                      </div>
                    </button>
                  </div>
                  <div className="col-12">
                    <button 
                      onClick={() => { setShowAddChoiceModal(false); setActiveSubTab('jobs'); setShowJobForm(true); }}
                      className="btn btn-outline-success w-100 p-4 rounded-4 text-start d-flex align-items-center transition-all glass-panel hover-bg-light"
                      style={{ border: '2px solid rgba(25, 135, 84, 0.25)' }}
                    >
                      <div className="bg-success text-white p-3 rounded-3 me-3">
                        <Briefcase size={24} />
                      </div>
                      <div>
                        <h6 className="fw-bold mb-1 text-dark">Job Posting</h6>
                        <p className="text-muted small mb-0">Post a new job opportunity for job seekers.</p>
                      </div>
                    </button>
                  </div>
                  <div className="col-12">
                    <button 
                      onClick={() => { setShowAddChoiceModal(false); setActiveSubTab('services'); setShowServiceForm(true); }}
                      className="btn btn-outline-secondary w-100 p-4 rounded-4 text-start d-flex align-items-center transition-all glass-panel hover-bg-light"
                      style={{ border: '2px solid rgba(108, 117, 125, 0.25)' }}
                    >
                      <div className="bg-secondary text-white p-3 rounded-3 me-3">
                        <Wrench size={24} />
                      </div>
                      <div>
                        <h6 className="fw-bold mb-1 text-dark">Service Provider</h6>
                        <p className="text-muted small mb-0">Offer cleaning, plumbing, electrical, or design services.</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;
