const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const readImageFileAsDataUrl = (file) => {
    if (!file?.type.startsWith('image/')) {
        throw new Error('Please choose a valid image file.');
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
        throw new Error('Image size must not exceed 5 MB.');
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(
            typeof reader.result === 'string' ? reader.result : ''
        );
        reader.onerror = () => reject(new Error('Unable to read the selected image.'));
        reader.readAsDataURL(file);
    });
};
