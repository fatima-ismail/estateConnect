const FormModal = ({ children, onClose }) => (
  <div
    className="modal fade show d-block animate-fade-in"
    tabIndex="-1"
    style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}
  >
    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
        <div className="position-absolute top-0 end-0 p-3" style={{ zIndex: 1100 }}>
          <button
            type="button"
            className="btn-close bg-white p-2 rounded-circle shadow-sm"
            aria-label="Close"
            onClick={onClose}
          />
        </div>
        <div className="modal-body p-0">
          {children}
        </div>
      </div>
    </div>
  </div>
);

export default FormModal;
