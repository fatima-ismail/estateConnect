import { Building, Wrench } from 'lucide-react';
import heroSvg from '../assets/estateconnect_no_background.svg';

const HeroSection = ({ onExploreProperties, onExploreServices }) => {
  return (
    <div className="position-relative overflow-hidden pt-1 pb-4 mb-4 bg-transparent">
      <div className="position-absolute bg-primary rounded-circle" style={{ width: '260px', height: '260px', top: '-90px', left: '-90px', filter: 'blur(45px)', opacity: 0.12 }}></div>
      <div className="position-absolute bg-warning rounded-circle" style={{ width: '220px', height: '220px', bottom: '-80px', right: '-70px', filter: 'blur(45px)', opacity: 0.1 }}></div>

      <div className="container position-relative z-2">
        <div className="row align-items-center g-4">
          <div className="col-lg-6 text-start">
            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill mb-1 fw-bold border border-primary-subtle" style={{ letterSpacing: '1.5px', fontSize: '0.75rem' }}>
              LEBANON'S PREMIUM PORTAL
            </span>
            <h1 className="display-4 fw-extrabold mt-0 mb-3 text-dark" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-1.5px', lineHeight: '1.15' }}>
              Connect with <span className="text-primary">Premium Estates</span> <br /> & Verified <span className="text-warning">Services</span>
            </h1>
            <p className="lead text-muted mb-4" style={{ fontSize: '1.05rem', fontWeight: '400', lineHeight: '1.6' }}>
              Discover verified properties to rent or buy, and hire certified local professionals for plumbing, electrical, cleaning, and more.
            </p>

            <div className="d-flex flex-wrap gap-3 mt-4">
              <button
                onClick={onExploreProperties}
                className="btn btn-premium d-inline-flex align-items-center px-4 py-3 rounded-pill shadow-sm"
                style={{ transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                <Building size={18} className="me-2" />
                Explore Properties
              </button>
              <button
                onClick={onExploreServices}
                className="btn btn-premium-outline d-inline-flex align-items-center px-4 py-3 rounded-pill"
                style={{ transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                <Wrench size={18} className="me-2 color-gray" />
                Explore Services
              </button>
            </div>
          </div>
          <div className="col-lg-6 d-flex align-items-center justify-content-center">
            <div className="w-100 position-relative fade-in-content" style={{ maxWidth: '490px' }}>
              <div className="position-absolute bg-primary rounded-circle" style={{ width: '90px', height: '90px', top: '10px', right: '10px', filter: 'blur(34px)', opacity: 0.32 }}></div>
              <div className="position-absolute bg-info rounded-circle" style={{ width: '110px', height: '110px', bottom: '10px', left: '10px', filter: 'blur(38px)', opacity: 0.24 }}></div>

              <img
                src={heroSvg}
                alt="EstateConnect Hero"
                className="w-100 h-auto position-relative z-1"
                style={{ objectFit: 'contain' }}
              />

              <div className="position-absolute bottom-0 start-0 z-2 bg-white p-3 rounded-4 shadow border" style={{ transform: 'translate(-20px, 20px)' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-success text-white p-2 rounded-circle d-flex align-items-center justify-content-center shadow-sm">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  </div>
                  <div>
                    <div className="fw-bold text-dark lh-1 mb-1" style={{ fontSize: '0.95rem' }}>100% Verified</div>
                    <div className="text-muted lh-1" style={{ fontSize: '0.8rem' }}>Properties & Services</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
