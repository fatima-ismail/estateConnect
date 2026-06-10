import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Properties from './pages/Properties'
import HomeServices from './pages/HomeServices'
import Account from './pages/Account'
import PropertyDetail from './pages/PropertyDetail'
import ServiceDetail from './pages/ServiceDetail'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import { UserProvider } from './context/UserProvider'
import { useUser } from './context/useUser'
import { Building2, Mail, Phone, MapPin } from 'lucide-react'

function ProtectedAccount(props) {
    const { currentUser, loading } = useUser();

    if (loading) {
        return <div className="container py-5 text-center text-muted">Checking your session...</div>;
    }

    if (!currentUser) {
        return (
            <div className="container py-5">
                <div className="alert alert-warning shadow-sm mb-0">
                    Please log in to access your account area.
                </div>
            </div>
        );
    }

    return <Account {...props} />;
}

const pagePaths = {
    home: '/',
    properties: '/properties',
    services: '/services',
    jobs: '/jobs',
    account: '/account',
};

function PropertyDetailRoute() {
    const { propertyId } = useParams();
    const navigate = useNavigate();
    return <PropertyDetail propertyId={propertyId} onBack={() => navigate('/properties')} />;
}

function ServiceDetailRoute() {
    const { serviceId } = useParams();
    const navigate = useNavigate();
    return <ServiceDetail serviceId={serviceId} onBack={() => navigate('/services')} />;
}

function JobDetailRoute() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    return <JobDetail jobId={jobId} onBack={() => navigate('/jobs')} />;
}

function App() {
    const navigate = useNavigate();
    const location = useLocation();
    const [accountSubTab, setAccountSubTab] = useState('profile');
    const [filters, setFilters] = useState({ query: '', location: '' });

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [location.pathname]);

    const setActivePage = (page) => {
        navigate(pagePaths[page] ?? '/');
    };

    const activePage = location.pathname.startsWith('/properties') ? 'properties'
        : location.pathname.startsWith('/services') ? 'services'
            : location.pathname.startsWith('/jobs') ? 'jobs'
                : location.pathname.startsWith('/account') ? 'account'
                    : 'home';

    return (
        <UserProvider>
            <div className="app-shell d-flex flex-column min-vh-100 bg-light">
                <Navbar activePage={activePage} setActivePage={setActivePage} setAccountSubTab={setAccountSubTab} />

                <main className="flex-grow-1">
                    <Routes>
                        <Route path="/" element={<Home setActivePage={setActivePage} setFilters={setFilters} navigate={navigate} />} />
                        <Route path="/properties" element={<Properties initialFilters={filters} onViewProperty={(id) => navigate(`/properties/${id}`)} />} />
                        <Route path="/properties/:propertyId" element={<PropertyDetailRoute />} />
                        <Route path="/services" element={<HomeServices initialFilters={filters} onViewService={(id) => navigate(`/services/${id}`)} />} />
                        <Route path="/services/:serviceId" element={<ServiceDetailRoute />} />
                        <Route path="/jobs" element={<Jobs initialFilters={filters} onViewJob={(id) => navigate(`/jobs/${id}`)} />} />
                        <Route path="/jobs/:jobId" element={<JobDetailRoute />} />
                        <Route
                            path="/account"
                            element={(
                                <ProtectedAccount
                                    onViewProperty={(id) => navigate(`/properties/${id}`)}
                                    onViewService={(id) => navigate(`/services/${id}`)}
                                    onViewJob={(id) => navigate(`/jobs/${id}`)}
                                    setActivePage={setActivePage}
                                    activeSubTab={accountSubTab}
                                    setActiveSubTab={setAccountSubTab}
                                />
                            )}
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>

                <footer className="bg-white text-dark py-5 mt-auto border-top">
                    <div className="container">
                        <div className="row g-4">
                            <div className="col-lg-5">
                                <h5 className="fw-bold mb-3 d-flex align-items-center text-dark">
                                    <Building2 className="me-2 text-primary" size={24} />
                                    EstateConnect
                                </h5>
                                <p className="text-muted mb-4" style={{ fontSize: '0.95rem' }}>
                                    A calmer way to browse homes, compare locations, and connect directly with trusted local professionals across Lebanon. No hidden fees.
                                </p>
                                <div className="d-flex flex-wrap gap-2">
                                    <button type="button" onClick={() => setActivePage('properties')} className="btn btn-sm btn-outline-primary">
                                        Browse Homes
                                    </button>
                                    <button type="button" onClick={() => setActivePage('jobs')} className="btn btn-sm btn-outline-primary">
                                        Find Jobs
                                    </button>
                                    <button type="button" onClick={() => setActivePage('services')} className="btn btn-sm btn-outline-secondary">
                                        Find Services
                                    </button>
                                </div>
                            </div>

                            <div className="col-lg-3 col-md-6 offset-lg-1">
                                <h6 className="text-uppercase mb-4 fw-bold text-dark">Quick Links</h6>
                                <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                                    <li>
                                        <button type="button" onClick={() => setActivePage('home')} className="btn btn-link text-muted text-decoration-none p-0 hover-text-primary">Home</button>
                                    </li>
                                    <li>
                                        <button type="button" onClick={() => setActivePage('properties')} className="btn btn-link text-muted text-decoration-none p-0 hover-text-primary">Properties</button>
                                    </li>
                                    <li>
                                        <button type="button" onClick={() => setActivePage('jobs')} className="btn btn-link text-muted text-decoration-none p-0 hover-text-primary">Jobs</button>
                                    </li>
                                    <li>
                                        <button type="button" onClick={() => setActivePage('services')} className="btn btn-link text-muted text-decoration-none p-0 hover-text-primary">Services</button>
                                    </li>
                                    <li>
                                        <button type="button" onClick={() => setActivePage('account')} className="btn btn-link text-muted text-decoration-none p-0 hover-text-primary">Account Area</button>
                                    </li>
                                </ul>
                            </div>

                            <div className="col-lg-3 col-md-6">
                                <h6 className="text-uppercase mb-4 fw-bold text-dark">Talk To Support</h6>
                                <p className="text-muted small mb-3">
                                    Need help with a listing, an account update, or contacting a provider? Reach the support desk directly.
                                </p>
                                <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                                    <li className="text-muted d-flex align-items-center">
                                        <Mail size={16} className="me-2 text-primary" /> support@estateconnect.com
                                    </li>
                                    <li className="text-muted d-flex align-items-center">
                                        <Phone size={16} className="me-2 text-primary" /> +961 1 555 199
                                    </li>
                                    <li className="text-muted d-flex align-items-center">
                                        <MapPin size={16} className="me-2 text-primary" /> Beirut, Tripoli, Jounieh, Byblos
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <hr className="mt-5 mb-4 text-muted" />

                        <div className="d-flex justify-content-center align-items-center">
                            <span className="text-muted small text-center">Verified listings and reliable local services</span>
                        </div>
                    </div>
                </footer>
            </div>
        </UserProvider>
    )
}

export default App
