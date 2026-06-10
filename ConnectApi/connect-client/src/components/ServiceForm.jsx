import { useRef, useState } from 'react';
import { useUser } from '../context/useUser';
import {
    Wrench,
    DollarSign,
    MapPin,
    Clipboard,
    Image,
    PlusCircle,
    Check,
    Link
} from 'lucide-react';
import { SERVICE_VERIFICATION } from '../utils/serviceVerification';
import {
    hasText,
    isValidOptionalUrl
} from '../utils/formValidation';
import { getApiErrorMessage } from '../utils/apiError';
import { readImageFileAsDataUrl } from '../utils/imageFile';

const getInitialFormData = (service) => {
    if (service) {
        return {
            homeServiceId: service.homeServiceId,
            title: service.title || '',
            description: service.description || '',
            price: service.price ?? '',
            location: service.location || '',
            imageUrl: service.imageUrl || '',
            userId: service.userId,
            createdAt: service.createdAt,
            yearsOfExperience: service.yearsOfExperience || 0,
            links: service.links || ''
        };
    }

    return {
        title: '',
        description: '',
        price: '',
        location: '',
        imageUrl: '',
        yearsOfExperience: 0,
        links: ''
    };
};

const ServiceForm = ({ service, onSave, onCancel }) => {
    const { currentUser } = useUser();
    const isModerator = ['admin', 'subadmin'].includes(currentUser?.role);
    const [formData, setFormData] = useState(() => getInitialFormData(service));
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [errors, setErrors] = useState({});
    const [selectedImageName, setSelectedImageName] = useState('');
    const fileInputRef = useRef(null);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
        if (globalError) setGlobalError('');
    };

    const handleImageChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const imageUrl = await readImageFileAsDataUrl(file);
            setFormData((prev) => ({ ...prev, imageUrl }));
            setSelectedImageName(file.name);
            setGlobalError('');
        } catch (err) {
            setGlobalError(err.message);
            event.target.value = '';
        }
    };

    const handleRemoveImage = () => {
        setFormData((prev) => ({ ...prev, imageUrl: '' }));
        setSelectedImageName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        let newErrors = {};
        if (!hasText(formData.title)) newErrors.title = 'Title is required';
        if (!hasText(formData.description)) newErrors.description = 'Description is required';
        if (formData.price === '') newErrors.price = 'Price is required';
        else if (Number(formData.price) <= 0) newErrors.price = 'Price must be greater than zero';
        
        if (!hasText(formData.location)) newErrors.location = 'Location is required';
        if (!Number.isInteger(Number(formData.yearsOfExperience)) || Number(formData.yearsOfExperience) < 0) {
            newErrors.yearsOfExperience = 'Must be a whole number >= 0';
        }
        
        if (!isValidOptionalUrl(formData.links)) {
            newErrors.links = 'Enter a valid URL starting with http:// or https://';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setGlobalError('Please complete all required fields before submitting.');
            return;
        }

        if (!service && !currentUser?.userId) {
            setGlobalError('Unable to identify the current user.');
            return;
        }

        if (service) {
            const initial = getInitialFormData(service);
            const hasChanges = Object.keys(initial).some(key => {
                if (['homeServiceId', 'userId', 'createdAt'].includes(key)) return false;
                if (['price', 'yearsOfExperience'].includes(key)) {
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

        const serviceData = {
            ...formData,
            title: formData.title.trim(),
            description: formData.description.trim(),
            location: formData.location.trim(),
            imageUrl: formData.imageUrl.trim(),
            phone: currentUser?.phoneNumber || '',
            email: currentUser?.email || '',
            links: formData.links.trim(),
            price: Number(formData.price),
            yearsOfExperience: Number(formData.yearsOfExperience) || 0,
            userId: service ? service.userId : currentUser.userId,
            verificationStatus: SERVICE_VERIFICATION.inProgress
        };

        try {
            await onSave(serviceData);
            setFormData(getInitialFormData(null));
            setErrors({});
            setGlobalError('');
            setSelectedImageName('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            setGlobalError(getApiErrorMessage(err, 'Failed to save service. Verify input details.'));
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData(getInitialFormData(null));
        setErrors({});
        setGlobalError('');
        setSelectedImageName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        onCancel();
    };

    return (
        <div className="card form-modern p-4 p-md-5 fade-in-content">
            <h3 className="form-heading">
                <div className="form-icon-tile text-secondary">
                    <Wrench className="text-secondary" size={24} />
                </div>
                {service ? 'Edit Service Offering' : 'Register a New Service'}
            </h3>

            {globalError && (
                <div className="alert alert-danger py-2 px-3 mb-4 rounded-3 d-flex align-items-center" role="alert">
                    {globalError}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="row g-4">
                    <div className="col-12">
                        <div className={`input-group ${errors.title ? 'is-invalid' : ''}`}>
                            <span className="input-group-text bg-transparent border-end-0 text-muted px-3">
                                <Clipboard size={18} />
                            </span>
                            <div className="form-floating flex-grow-1">
                                <input
                                    type="text"
                                    name="title"
                                    id="serviceTitle"
                                    className={`form-control border-start-0 ps-0 ${errors.title ? 'is-invalid' : ''}`}
                                    placeholder="Service Title"
                                    value={formData.title}
                                    onChange={handleChange}
                                />
                                <label htmlFor="serviceTitle" className="text-muted ps-0">Service Title *</label>
                            </div>
                        </div>
                        {errors.title && <div className="text-danger small mt-1 ps-2">{errors.title}</div>}
                    </div>

                    <div className="col-md-6">
                        <div className={`input-group ${errors.price ? 'is-invalid' : ''}`}>
                            <span className="input-group-text bg-transparent border-end-0 text-muted px-3">
                                <DollarSign size={18} />
                            </span>
                            <div className="form-floating flex-grow-1">
                                <input
                                    type="number"
                                    name="price"
                                    id="servicePrice"
                                    className={`form-control border-start-0 ps-0 ${errors.price ? 'is-invalid' : ''}`}
                                    placeholder="Hourly Rate / Base Price ($) *"
                                    value={formData.price}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                />
                                <label htmlFor="servicePrice" className="text-muted ps-0">Hourly Rate / Base Price ($) *</label>
                            </div>
                        </div>
                        {errors.price && <div className="text-danger small mt-1 ps-2">{errors.price}</div>}
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
                                    id="serviceLocation"
                                    className={`form-control border-start-0 ps-0 ${errors.location ? 'is-invalid' : ''}`}
                                    placeholder="Service Area / Location *"
                                    value={formData.location}
                                    onChange={handleChange}
                                />
                                <label htmlFor="serviceLocation" className="text-muted ps-0">Service Area / Location *</label>
                            </div>
                        </div>
                        {errors.location && <div className="text-danger small mt-1 ps-2">{errors.location}</div>}
                    </div>

                    <div className="col-md-6">
                        <div className="form-floating">
                            <input
                                type="number"
                                name="yearsOfExperience"
                                id="yearsOfExperience"
                                className={`form-control bg-light ${errors.yearsOfExperience ? 'is-invalid' : ''}`}
                                placeholder="Years of Experience"
                                value={formData.yearsOfExperience}
                                onChange={handleChange}
                                min="0"
                            />
                            <label htmlFor="yearsOfExperience">Years of Experience</label>
                        </div>
                        {errors.yearsOfExperience && <div className="text-danger small mt-1 ps-2">{errors.yearsOfExperience}</div>}
                    </div>

                    <div className="col-12">
                        <div className={`input-group ${errors.links ? 'is-invalid' : ''}`}>
                            <span className="input-group-text bg-transparent border-end-0 text-muted px-3">
                                <Link size={18} />
                            </span>
                            <div className="form-floating flex-grow-1">
                                <input
                                    type="text"
                                    name="links"
                                    id="serviceLinks"
                                    className={`form-control border-start-0 ps-0 ${errors.links ? 'is-invalid' : ''}`}
                                    placeholder="Portfolio / Links"
                                    value={formData.links}
                                    onChange={handleChange}
                                />
                                <label htmlFor="serviceLinks" className="text-muted ps-0">Portfolio / Links (e.g., https://...)</label>
                            </div>
                        </div>
                        {errors.links && <div className="text-danger small mt-1 ps-2">{errors.links}</div>}
                    </div>

                    <div className="col-12">
                        <div className="form-floating">
                            <textarea
                                name="description"
                                id="serviceDescription"
                                className={`form-control bg-light ${errors.description ? 'is-invalid' : ''}`}
                                style={{ height: '100px' }}
                                placeholder="Service Description *"
                                value={formData.description}
                                onChange={handleChange}
                            />
                            <label htmlFor="serviceDescription">Service Description *</label>
                        </div>
                        {errors.description && <div className="text-danger small mt-1 ps-2">{errors.description}</div>}
                    </div>

                    <div className="col-12">
                        <label className="form-label fw-semibold text-muted">Service Image</label>
                        <div className="input-group">
                            <span className="input-group-text bg-transparent text-muted px-3 border-end-0">
                                <Image size={18} />
                            </span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="form-control border-start-0 p-3 bg-light"
                                onChange={handleImageChange}
                            />
                        </div>

                        {formData.imageUrl && (
                            <div className="glass-panel rounded-4 p-3 mt-3 position-relative overflow-hidden">
                                <img
                                    src={formData.imageUrl}
                                    alt="Service preview"
                                    className="w-100 rounded-3 object-fit-cover shadow-sm"
                                    style={{ maxHeight: '220px' }}
                                />
                                <button
                                    type="button"
                                    className="btn btn-light shadow-sm position-absolute"
                                    style={{ top: '24px', right: '24px' }}
                                    onClick={handleRemoveImage}
                                >
                                    Remove image
                                </button>
                            </div>
                        )}
                        <small className="text-muted d-block mt-2">
                            Choose an image from your device. Leave empty if this service should not show an image.
                        </small>
                    </div>
                </div>

                {!isModerator && (
                    <div className="alert alert-warning d-flex align-items-start rounded-4 py-3 px-3 mt-4 mb-0" role="alert">
                        <div>
                            <strong className="d-block mb-1">Admin review required</strong>
                            <span className="small">
                                Every new or updated service is submitted with <strong>In Progress</strong> status and stays hidden from public service browsing until an admin verifies it.
                            </span>
                        </div>
                    </div>
                )}

                <div className="d-flex justify-content-end gap-3 pt-4 mt-4 border-top">
                    <button
                        type="button"
                        className="btn btn-light px-4 py-2 rounded-3 fw-medium"
                        onClick={handleCancel}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-premium d-flex align-items-center px-4 py-2 rounded-3 shadow-sm"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                        ) : service ? (
                            <Check size={18} className="me-2" />
                        ) : (
                            <PlusCircle size={18} className="me-2" />
                        )}
                        {service ? 'Update Service' : 'Register Service'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ServiceForm;
