const getValidationMessage = (errors) => {
    if (!errors || typeof errors !== 'object') {
        return '';
    }

    return Object.values(errors)
        .flatMap((messages) => Array.isArray(messages) ? messages : [messages])
        .filter((message) => typeof message === 'string' && message.trim())
        .join(' ');
};

export const getApiErrorMessage = (error, fallbackMessage) => {
    const response = error?.response;
    const data = response?.data;

    if (!response) {
        return 'Unable to reach the server. Please try again.';
    }

    if (typeof data === 'string' && data.trim()) {
        return data;
    }

    const validationMessage = getValidationMessage(data?.errors);
    if (validationMessage) {
        return validationMessage;
    }

    if (typeof data?.message === 'string' && data.message.trim()) {
        return data.message;
    }

    if (response.status === 401) {
        return 'Your session has expired. Please log in again.';
    }

    if (response.status === 403) {
        return 'You do not have permission to perform this action.';
    }

    return fallbackMessage;
};
