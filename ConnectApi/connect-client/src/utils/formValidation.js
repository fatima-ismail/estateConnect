export const hasText = (value) =>
    typeof value === 'string' && value.trim().length > 0;

export const isValidEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const isValidPhone = (value) => {
    const phone = value.trim();

    return (
        /^[+]?[\d\s().-]+$/.test(phone) &&
        phone.replace(/\D/g, '').length >= 7
    );
};

export const isValidOptionalPhone = (value) =>
    !value.trim() || isValidPhone(value);

export const LEBANESE_PHONE_PREFIX = '+961';

export const getLebanesePhoneDigits = (value) => {
    const digits = String(value || '').replace(/\D/g, '');

    if (digits.startsWith('961')) {
        return digits.slice(3);
    }

    return digits;
};

export const isValidLebanesePhone = (value) =>
    /^\d{8}$/.test(getLebanesePhoneDigits(value));

export const isValidOptionalLebanesePhone = (value) =>
    !String(value || '').trim() || isValidLebanesePhone(value);

export const formatLebanesePhone = (value) => {
    const digits = getLebanesePhoneDigits(value);

    return digits ? `${LEBANESE_PHONE_PREFIX}${digits}` : '';
};

export const isValidOptionalUrl = (value) => {
    if (!value.trim()) {
        return true;
    }

    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};
