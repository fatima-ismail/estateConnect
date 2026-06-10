import { useEffect, useRef, useState } from 'react';
import { useUser } from '../context/useUser';
import {
    Building,
    DollarSign,
    MapPin,
    Clipboard,
    Square,
    Bed,
    Bath,
    Image,
    PlusCircle,
    Check
} from 'lucide-react';
import {
    hasText
} from '../utils/formValidation';
import { getApiErrorMessage } from '../utils/apiError';
import { readImageFileAsDataUrl } from '../utils/imageFile';

const PROPERTY_TYPES = [
    'Apartment',
    'Villa',
    'Land',
    'Office',
    'Shop',
    'House',
    'Studio'
];

const PROPERTY_STATUSES = [
    'For Sale',
    'For Rent',
    'Sold',
    'Rented'
];

const getInitialFormData = (property) => {
    if (property) {
        return {
            propertyId: property.propertyId,
            title: property.title || '',
            description: property.description || '',
            price: property.price ?? '',
            location: property.location || '',
            propertyType: property.propertyType || 'Apartment',
            status: property.status || 'For Sale',
            bedrooms: property.bedrooms ?? 0,
            bathrooms: property.bathrooms ?? 0,
            area: property.area ?? '',
            imageUrl: property.imageUrl || '',
            userId: property.userId,
            createdAt: property.createdAt
        };
    }

    return {
        title: '',
        description: '',
        price: '',
        location: '',
        propertyType: 'Apartment',
        status: 'For Sale',
        bedrooms: 0,
        bathrooms: 0,
        area: '',
        imageUrl: ''
    };
};

const PropertyForm = ({ property, onSave, onCancel }) => {
    const { currentUser } = useUser();
    const isEditing = Boolean(property);
    const isModerator = ['admin', 'subadmin'].includes(currentUser?.role);

    const [formData, setFormData] = useState(() => getInitialFormData(property));
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [errors, setErrors] = useState({});
    const [selectedImageName, setSelectedImageName] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
    }, [isEditing]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
        if (globalError) {
            setGlobalError('');
        }
    };

    const handleImageChange = async (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        try {
            const imageUrl = await readImageFileAsDataUrl(file);
            setFormData((previousData) => ({
                ...previousData,
                imageUrl
            }));

            setSelectedImageName(file.name);
            setGlobalError('');
        } catch (err) {
            setGlobalError(err.message);
            event.target.value = '';
        }
    };

    const handleRemoveImage = () => {
        setFormData((previousData) => ({
            ...previousData,
            imageUrl: ''
        }));

        setSelectedImageName('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        let newErrors = {};
        
        if (!hasText(formData.title)) newErrors.title = 'Title is required';
        if (!hasText(formData.description)) newErrors.description = 'Description is required';
        if (formData.price === '') newErrors.price = 'Price is required';
        else if (Number(formData.price) <= 0) newErrors.price = 'Price must be greater than zero';
        
        if (!hasText(formData.location)) newErrors.location = 'Location is required';
        if (formData.area === '') newErrors.area = 'Area is required';
        else if (Number(formData.area) <= 0) newErrors.area = 'Area must be greater than zero';
        
        if (!Number.isInteger(Number(formData.bedrooms)) || Number(formData.bedrooms) < 0) {
            newErrors.bedrooms = 'Must be a whole number >= 0';
        }
        if (!Number.isInteger(Number(formData.bathrooms)) || Number(formData.bathrooms) < 0) {
            newErrors.bathrooms = 'Must be a whole number >= 0';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setGlobalError('Please complete all required fields before submitting.');
            return;
        }

        if (!isEditing && !currentUser?.userId) {
            setGlobalError('Unable to identify the current user.');
            return;
        }

        if (isEditing) {
            const initial = getInitialFormData(property);
            const hasChanges = Object.keys(initial).some(key => {
                if (['createdAt', 'userId', 'propertyId'].includes(key)) return false;
                if (['price', 'area', 'bedrooms', 'bathrooms'].includes(key)) {
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

        const propertyData = {
            ...formData,
            title: formData.title.trim(),
            description: formData.description.trim(),
            location: formData.location.trim(),
            ownerName: currentUser?.fullName || '',
            ownerPhone: currentUser?.phoneNumber || '',
            ownerEmail: currentUser?.email || '',
            price: Number(formData.price),
            area: Number(formData.area),
            bedrooms: Number(formData.bedrooms) || 0,
            bathrooms: Number(formData.bathrooms) || 0,
            userId: isEditing ? property.userId : currentUser.userId
        };

        try {
            await onSave(propertyData);
            setFormData(getInitialFormData(null));
            setErrors({});
            setGlobalError('');
            setSelectedImageName('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            setGlobalError(getApiErrorMessage(
                err,
                'Failed to save property. Verify input details.'
            ));
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData(getInitialFormData(null));
        setErrors({});
        setGlobalError('');
        setSelectedImageName('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onCancel();
    };

    return (
        <div className="card form-modern p-4 p-md-5 fade-in-content">
            <h3 className="form-heading">
                <div className="form-icon-tile text-primary">
                    <Building className="text-primary" size={24} />
                </div>
                {isEditing ? 'Edit Property Listing' : 'List a New Property'}
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
                                    id="propertyTitle"
                                    className={`form-control border-start-0 ps-0 ${errors.title ? 'is-invalid' : ''}`}
                                    placeholder="Property Title"
                                    value={formData.title}
                                    onChange={handleChange}
                                />
                                <label htmlFor="propertyTitle" className="text-muted ps-0">Property Title *</label>
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
                                    id="propertyPrice"
                                    className={`form-control border-start-0 ps-0 ${errors.price ? 'is-invalid' : ''}`}
                                    placeholder="Price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                />
                                <label htmlFor="propertyPrice" className="text-muted ps-0">Price ($) *</label>
                            </div>
                        </div>
                        {errors.price && <div className="text-danger small mt-1 ps-2">{errors.price}</div>}
                    </div>

                    <div className="col-md-6">
                        <div className={`input-group ${errors.area ? 'is-invalid' : ''}`}>
                            <span className="input-group-text bg-transparent border-end-0 text-muted px-3">
                                <Square size={18} />
                            </span>
                            <div className="form-floating flex-grow-1">
                                <input
                                    type="number"
                                    name="area"
                                    id="propertyArea"
                                    className={`form-control border-start-0 ps-0 ${errors.area ? 'is-invalid' : ''}`}
                                    placeholder="Area"
                                    value={formData.area}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                />
                                <label htmlFor="propertyArea" className="text-muted ps-0">Area (m²) *</label>
                            </div>
                        </div>
                        {errors.area && <div className="text-danger small mt-1 ps-2">{errors.area}</div>}
                    </div>

                    <div className="col-12">
                        <div className={`input-group ${errors.location ? 'is-invalid' : ''}`}>
                            <span className="input-group-text bg-transparent border-end-0 text-muted px-3">
                                <MapPin size={18} />
                            </span>
                            <div className="form-floating flex-grow-1">
                                <input
                                    type="text"
                                    name="location"
                                    id="propertyLocation"
                                    className={`form-control border-start-0 ps-0 ${errors.location ? 'is-invalid' : ''}`}
                                    placeholder="Location"
                                    value={formData.location}
                                    onChange={handleChange}
                                />
                                <label htmlFor="propertyLocation" className="text-muted ps-0">Location / Address *</label>
                            </div>
                        </div>
                        {errors.location && <div className="text-danger small mt-1 ps-2">{errors.location}</div>}
                    </div>

                    <div className="col-md-6">
                        <div className="form-floating">
                            <select
                                name="propertyType"
                                id="propertyType"
                                className="form-select bg-light"
                                value={formData.propertyType}
                                onChange={handleChange}
                            >
                                {PROPERTY_TYPES.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            <label htmlFor="propertyType">Property Type</label>
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className="form-floating">
                            <select
                                name="status"
                                id="propertyStatus"
                                className="form-select bg-light"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                {PROPERTY_STATUSES.map((status) => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                            <label htmlFor="propertyStatus">Listing Status</label>
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className={`input-group ${errors.bedrooms ? 'is-invalid' : ''}`}>
                            <span className="input-group-text bg-transparent border-end-0 text-muted px-3">
                                <Bed size={18} />
                            </span>
                            <div className="form-floating flex-grow-1">
                                <input
                                    type="number"
                                    name="bedrooms"
                                    id="propertyBedrooms"
                                    className={`form-control border-start-0 ps-0 ${errors.bedrooms ? 'is-invalid' : ''}`}
                                    placeholder="Bedrooms"
                                    min="0"
                                    value={formData.bedrooms}
                                    onChange={handleChange}
                                />
                                <label htmlFor="propertyBedrooms" className="text-muted ps-0">Bedrooms</label>
                            </div>
                        </div>
                        {errors.bedrooms && <div className="text-danger small mt-1 ps-2">{errors.bedrooms}</div>}
                    </div>

                    <div className="col-md-6">
                        <div className={`input-group ${errors.bathrooms ? 'is-invalid' : ''}`}>
                            <span className="input-group-text bg-transparent border-end-0 text-muted px-3">
                                <Bath size={18} />
                            </span>
                            <div className="form-floating flex-grow-1">
                                <input
                                    type="number"
                                    name="bathrooms"
                                    id="propertyBathrooms"
                                    className={`form-control border-start-0 ps-0 ${errors.bathrooms ? 'is-invalid' : ''}`}
                                    placeholder="Bathrooms"
                                    min="0"
                                    value={formData.bathrooms}
                                    onChange={handleChange}
                                />
                                <label htmlFor="propertyBathrooms" className="text-muted ps-0">Bathrooms</label>
                            </div>
                        </div>
                        {errors.bathrooms && <div className="text-danger small mt-1 ps-2">{errors.bathrooms}</div>}
                    </div>
                    
                    <div className="col-12">
                        <div className="form-floating">
                            <textarea
                                name="description"
                                id="propertyDescription"
                                className={`form-control bg-light ${errors.description ? 'is-invalid' : ''}`}
                                style={{ height: '100px' }}
                                placeholder="Description"
                                value={formData.description}
                                onChange={handleChange}
                            />
                            <label htmlFor="propertyDescription">Description *</label>
                        </div>
                        {errors.description && <div className="text-danger small mt-1 ps-2">{errors.description}</div>}
                    </div>

                    <div className="col-12">
                        <label className="form-label fw-semibold text-muted">Property Image</label>
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
                                    alt="Property preview"
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
                            Choose an image from your device. Leave empty if this listing should not show an image.
                        </small>
                    </div>
                </div>

                {!isModerator && (
                    <div className="alert alert-warning d-flex align-items-start rounded-4 py-3 px-3 mt-4 mb-0" role="alert">
                        <div>
                            <strong className="d-block mb-1">Admin review required</strong>
                            <span className="small">
                                Every new or updated property is submitted with <strong>In Progress</strong> status and stays hidden from public property browsing until an admin verifies it.
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
                        ) : isEditing ? (
                            <Check size={18} className="me-2" />
                        ) : (
                            <PlusCircle size={18} className="me-2" />
                        )}
                        {isEditing ? 'Update Listing' : 'Publish Listing'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PropertyForm;
