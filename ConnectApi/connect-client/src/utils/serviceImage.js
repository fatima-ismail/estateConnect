export const serviceImagePlaceholder = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">
  <rect width="1200" height="700" fill="#d1d5db"/>
</svg>
`)}`;

export const useServiceImagePlaceholder = (event) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = serviceImagePlaceholder;
};
