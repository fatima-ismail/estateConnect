import { useEffect, useState } from 'react';
import { useUser } from '../context/useUser';
import { Home, Building2, Wrench, Briefcase, UserCheck, ShieldAlert, LogIn, UserPlus, Plus } from 'lucide-react';
import PropertyForm from './PropertyForm';
import ServiceForm from './ServiceForm';
import * as propertyApi from '../services/propertyServices';
import * as serviceApi from '../services/servicesServices';
import {
  hasText,
  isValidEmail,
  isValidLebanesePhone,
  formatLebanesePhone,
  getLebanesePhoneDigits
} from '../utils/formValidation';
import { getApiErrorMessage } from '../utils/apiError';

const Navbar = ({ activePage, setActivePage, setAccountSubTab }) => {
  const { currentUser, login, registerUser } = useUser();
  const isModerator = currentUser?.role === 'admin' || currentUser?.role === 'subadmin';



  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showAddChoiceModal, setShowAddChoiceModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: 'user'
  });

  const [authError, setAuthError] = useState('');
  const [loginErrors, setLoginErrors] = useState({});
  const [registerErrors, setRegisterErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'properties', label: 'Properties', icon: Building2 },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'services', label: 'Services', icon: Wrench },
  ];

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};

    if (!hasText(loginData.email)) newErrors.email = 'Email is required';
    if (!hasText(loginData.password)) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setLoginErrors(newErrors);
      return;
    }

    setAuthError('');
    setLoginErrors({});
    setSubmitting(true);
    
    try {
      const loggedInUser = await login(loginData.email.trim(), loginData.password);
      setShowLoginModal(false);
      setLoginData({ email: '', password: '' });
      setAccountSubTab(
        'profile'
      );
      setActivePage(loggedInUser.role === 'admin' ? 'home' : 'account');
    } catch (err) {
      setAuthError(getApiErrorMessage(err, 'Unable to log in. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};

    if (!hasText(registerData.fullName)) newErrors.fullName = 'Full name is required';
    if (!hasText(registerData.email)) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(registerData.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    
    if (!hasText(registerData.password)) {
      newErrors.password = 'Password is required';
    } else if (registerData.password.length < 8) {
      newErrors.password = 'Must be at least 8 characters';
    }

    if (!hasText(registerData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!isValidLebanesePhone(registerData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be exactly 8 digits after +961';
    }

    if (Object.keys(newErrors).length > 0) {
      setRegisterErrors(newErrors);
      return;
    }

    setAuthError('');
    setRegisterErrors({});
    setSubmitting(true);

    const apiPayload = {
      fullName: registerData.fullName.trim(),
      email: registerData.email.trim(),
      phoneNumber: formatLebanesePhone(registerData.phoneNumber),
      role: registerData.role,
      imageUrl: null,
      password: registerData.password
    };

    try {
      await registerUser(apiPayload);
      setShowRegisterModal(false);
      setRegisterData({ fullName: '', email: '', phoneNumber: '', password: '', role: 'user' });
      setActivePage('account');
    } catch (err) {
      setAuthError(getApiErrorMessage(err, 'Unable to create your account. Please try again.'));
      const errMsg = getApiErrorMessage(err).toLowerCase();
      if (errMsg.includes('phone number')) {
        setRegisterErrors({ phoneNumber: 'Phone number already exists' });
      } else if (errMsg.includes('email')) {
        setRegisterErrors({ email: 'Email already exists' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <nav
        className="navbar navbar-expand-lg navbar-light sticky-top bg-secondary-subtle shadow-sm py-3"
        style={{ marginBottom: '20px' }}
      >
        <div className="container">
          <a
            className="navbar-brand d-flex align-items-center fw-bold fs-4 text-gradient cursor-pointer"
            href="#"
            onClick={(e) => { e.preventDefault(); setActivePage('home'); }}
          >
            <Building2 className="me-2 text-primary" size={28} />
            <span style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>Estate<span className="text-secondary">Connect</span></span>
          </a>

          <button
            className="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarContent"
            aria-controls="navbarContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarContent">
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <li className="nav-item mx-1" key={item.id}>
                    <a
                      className={`nav-link d-flex align-items-center px-3 py-2 rounded-3 transition-all ${isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-dark hover-bg-light'
                        }`}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setActivePage(item.id);
                      }}
                      style={{ fontWeight: isActive ? '600' : '500' }}
                    >
                      <Icon className="me-2" size={18} />
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>

            <div className="d-flex align-items-center gap-2">
              {currentUser ? (
                <>
                  <button
                    className={`btn d-flex align-items-center px-3 py-2 rounded-3 transition-all ${
                      activePage === 'account'
                        ? 'bg-primary-subtle text-dark border border-primary-subtle shadow-sm'
                        : 'bg-light text-dark border hover-bg-light glass-panel'
                    }`}
                    onClick={() => setActivePage('account')}
                  >
                    {currentUser.imageUrl ? (
                      <img
                        src={currentUser.imageUrl}
                        alt={currentUser.fullName}
                        className="rounded-circle me-2 object-fit-cover"
                        style={{ width: '28px', height: '28px' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : ['admin', 'subadmin'].includes(currentUser.role) ? (
                      <ShieldAlert className={`${activePage === 'account' ? 'text-dark' : 'text-danger'} me-2`} size={18} />
                    ) : (
                      <UserCheck className={`${activePage === 'account' ? 'text-dark' : 'text-success'} me-2`} size={18} />
                    )}
                    <div className="text-start ms-1">
                      <div className="fw-semibold lh-1" style={{ fontSize: '0.85rem' }}>{currentUser.fullName}</div>
                    </div>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setAuthError(''); setLoginErrors({}); setLoginData({ email: '', password: '' }); setShowLoginModal(true); }}
                    className="btn btn-premium-outline d-flex align-items-center border-1 px-3 py-2"
                  >
                    <LogIn size={16} className="me-1" />
                    Log In
                  </button>
                  <button
                    onClick={() => { setAuthError(''); setRegisterErrors({}); setRegisterData({ fullName: '', email: '', phoneNumber: '', password: '', role: 'user' }); setShowRegisterModal(true); }}
                    className="btn btn-premium d-flex align-items-center px-3 py-2"
                  >
                    <UserPlus size={16} className="me-1" />
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {showLoginModal && (
        <div className="modal fade show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
            <div className="modal-content auth-modal">
              <div className="modal-header border-bottom-0 pb-0 pt-4 px-4">
                <h4 className="modal-title form-heading mb-0">
                  <div className="form-icon-tile text-primary">
                    <LogIn className="text-primary" size={20} />
                  </div>
                  Welcome Back
                </h4>
                <button type="button" className="btn-close" onClick={() => { setShowLoginModal(false); setLoginData({ email: '', password: '' }); setLoginErrors({}); }}></button>
              </div>
              <form onSubmit={handleLoginSubmit}>
                <div className="modal-body p-4">
                  {authError && (
                    <div className="alert alert-danger py-2 mb-4 small rounded-3" role="alert">
                      {authError}
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <div className="form-floating">
                      <input
                        type="email"
                        id="loginEmail"
                        className={`form-control bg-light ${loginErrors.email ? 'is-invalid' : ''}`}
                        placeholder="Email Address"
                        value={loginData.email}
                        onChange={(e) => {
                          setLoginData({ ...loginData, email: e.target.value });
                          if (loginErrors.email) setLoginErrors({...loginErrors, email: null});
                          setAuthError('');
                        }}
                      />
                      <label htmlFor="loginEmail">Email Address</label>
                    </div>
                    {loginErrors.email && <div className="text-danger small mt-1 ps-2">{loginErrors.email}</div>}
                  </div>

                  <div className="mb-2">
                    <div className="form-floating">
                      <input
                        type="password"
                        id="loginPassword"
                        className={`form-control bg-light ${loginErrors.password ? 'is-invalid' : ''}`}
                        placeholder="Password"
                        value={loginData.password}
                        onChange={(e) => {
                          setLoginData({ ...loginData, password: e.target.value });
                          if (loginErrors.password) setLoginErrors({...loginErrors, password: null});
                          setAuthError('');
                        }}
                      />
                      <label htmlFor="loginPassword">Password</label>
                    </div>
                    {loginErrors.password && <div className="text-danger small mt-1 ps-2">{loginErrors.password}</div>}
                  </div>
                </div>
                <div className="modal-footer border-top-0 pt-0 px-4 pb-4">
                  <button type="button" className="btn btn-light px-4 rounded-pill w-100 mb-2" onClick={() => { setShowLoginModal(false); setLoginData({ email: '', password: '' }); setLoginErrors({}); }}>Cancel</button>
                  <button type="submit" className="btn btn-premium px-4 rounded-pill w-100 m-0 shadow-sm" disabled={submitting}>
                    {submitting ? 'Verifying...' : 'Log In'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showRegisterModal && (
        <div className="modal fade show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content auth-modal">
              <div className="modal-header border-bottom-0 pb-0 pt-4 px-4">
                <h4 className="modal-title form-heading mb-0">
                  <div className="form-icon-tile text-primary">
                    <UserPlus className="text-primary" size={20} />
                  </div>
                  Create Account
                </h4>
                <button type="button" className="btn-close" onClick={() => { setShowRegisterModal(false); setRegisterData({ fullName: '', email: '', phoneNumber: '', password: '', role: 'user' }); setRegisterErrors({}); }}></button>
              </div>
              <form onSubmit={handleRegisterSubmit}>
                <div className="modal-body p-4">
                  {authError && (
                    <div className="alert alert-danger py-2 mb-4 small rounded-3" role="alert">
                      {authError}
                    </div>
                  )}

                  <div className="mb-3">
                    <div className="form-floating">
                      <input
                        type="text"
                        id="registerName"
                        className={`form-control bg-light ${registerErrors.fullName ? 'is-invalid' : ''}`}
                        placeholder="Full Name"
                        value={registerData.fullName}
                        onChange={(e) => {
                          setRegisterData({ ...registerData, fullName: e.target.value });
                          if (registerErrors.fullName) setRegisterErrors({...registerErrors, fullName: null});
                        }}
                      />
                      <label htmlFor="registerName">Full Name *</label>
                    </div>
                    {registerErrors.fullName ? (
                      <div className="text-danger small mt-1 ps-2">{registerErrors.fullName}</div>
                    ) : (
                      <div className="form-text text-muted small mt-1">Use your real name or company representative name.</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="form-floating">
                      <input
                        type="email"
                        id="registerEmail"
                        className={`form-control bg-light ${registerErrors.email ? 'is-invalid' : ''}`}
                        placeholder="Email Address"
                        value={registerData.email}
                        onChange={(e) => {
                          setRegisterData({ ...registerData, email: e.target.value });
                          if (registerErrors.email) setRegisterErrors({...registerErrors, email: null});
                          setAuthError('');
                        }}
                      />
                      <label htmlFor="registerEmail">Email Address *</label>
                    </div>
                    {registerErrors.email ? (
                      <div className="text-danger small mt-1 ps-2">{registerErrors.email}</div>
                    ) : (
                      <div className="form-text text-muted small mt-1">Use an email you can access for login and account updates.</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="form-floating">
                      <select
                        id="registerRole"
                        className="form-select bg-light"
                        value={registerData.role}
                        onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })}
                      >
                        <option value="user">Normal User</option>
                        <option value="company">Company</option>
                      </select>
                      <label htmlFor="registerRole">Account Type *</label>
                    </div>
                    <div className="form-text text-muted small mt-1">Choose Normal User for properties/services, or Company for job postings.</div>
                  </div>

                  <div className="mb-3">
                    <div className="form-floating">
                      <input
                        type="password"
                        id="registerPassword"
                        className={`form-control bg-light ${registerErrors.password ? 'is-invalid' : ''}`}
                        placeholder="Password"
                        value={registerData.password}
                        onChange={(e) => {
                          setRegisterData({ ...registerData, password: e.target.value });
                          if (registerErrors.password) setRegisterErrors({...registerErrors, password: null});
                        }}
                      />
                      <label htmlFor="registerPassword">Password *</label>
                    </div>
                    {registerErrors.password ? (
                      <div className="text-danger small mt-1 ps-2">{registerErrors.password}</div>
                    ) : (
                      <div className="form-text text-muted small mt-1">Must be at least 8 characters long.</div>
                    )}
                  </div>

                  <div className="mb-2">
                    <label htmlFor="registerPhone" className="form-label fw-semibold small text-muted">Phone Number *</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light fw-semibold">+961</span>
                      <input
                        type="tel"
                        id="registerPhone"
                        className={`form-control bg-light ${registerErrors.phoneNumber ? 'is-invalid' : ''}`}
                        placeholder="70123456"
                        value={registerData.phoneNumber}
                        maxLength="8"
                        inputMode="numeric"
                        onChange={(e) => {
                          setRegisterData({ ...registerData, phoneNumber: getLebanesePhoneDigits(e.target.value).slice(0, 8) });
                          if (registerErrors.phoneNumber) setRegisterErrors({...registerErrors, phoneNumber: null});
                          setAuthError('');
                        }}
                      />
                    </div>
                    {registerErrors.phoneNumber ? (
                      <div className="text-danger small mt-1 ps-2">{registerErrors.phoneNumber}</div>
                    ) : (
                      <div className="form-text text-muted small mt-1">Enter 8 digits only. We will save it as +961 followed by your number.</div>
                    )}
                  </div>
                </div>
                <div className="modal-footer border-top-0 pt-0 px-4 pb-4">
                  <button type="button" className="btn btn-light px-4 rounded-pill w-100 mb-2" onClick={() => { setShowRegisterModal(false); setRegisterData({ fullName: '', email: '', phoneNumber: '', password: '', role: 'user' }); setRegisterErrors({}); }}>Cancel</button>
                  <button type="submit" className="btn btn-premium px-4 rounded-pill w-100 m-0 shadow-sm" disabled={submitting}>
                    {submitting ? 'Registering...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
                      onClick={() => { setShowAddChoiceModal(false); setShowPropertyModal(true); }}
                      className="btn btn-outline-primary w-100 p-4 rounded-4 text-start d-flex align-items-center transition-all glass-panel hover-bg-light"
                      style={{ border: '2px solid rgba(13, 110, 253, 0.25)' }}
                    >
                      <div className="bg-primary text-white p-3 rounded-3 me-3">
                        <Building2 size={24} />
                      </div>
                      <div>
                        <h6 className="fw-bold mb-1 text-dark">Real Estate Property</h6>
                        <p className="text-muted small mb-0">List apartments, villas, land, or office spaces for sale/rent.</p>
                      </div>
                    </button>
                  </div>
                  <div className="col-12">
                    <button
                      onClick={() => { setShowAddChoiceModal(false); setShowServiceModal(true); }}
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

      {showPropertyModal && (
        <div className="modal fade show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="position-absolute top-0 end-0 p-3" style={{ zIndex: 1100 }}>
                <button type="button" className="btn-close bg-white p-2 rounded-circle shadow-sm" onClick={() => setShowPropertyModal(false)}></button>
              </div>
              <div className="modal-body p-0">
                <PropertyForm
                  onSave={async (propertyData) => {
                    await propertyApi.create(propertyData);
                    setShowPropertyModal(false);
                    alert("Property published successfully!");
                    window.location.reload();
                  }}
                  onCancel={() => setShowPropertyModal(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {showServiceModal && (
        <div className="modal fade show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="position-absolute top-0 end-0 p-3" style={{ zIndex: 1100 }}>
                <button type="button" className="btn-close bg-white p-2 rounded-circle shadow-sm" onClick={() => setShowServiceModal(false)}></button>
              </div>
              <div className="modal-body p-0">
                <ServiceForm
                  onSave={async (serviceData) => {
                    await serviceApi.create(serviceData);
                    setShowServiceModal(false);
                    alert("Service registered successfully!");
                    window.location.reload();
                  }}
                  onCancel={() => setShowServiceModal(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
