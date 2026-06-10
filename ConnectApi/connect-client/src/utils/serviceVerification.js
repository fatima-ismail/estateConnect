export const SERVICE_VERIFICATION = {
  inProgress: 'InProgress',
  verified: 'Verified',
  notAccepted: 'NotAccepted',
};

export const getServiceVerificationLabel = (status) => {
  switch (status) {
    case SERVICE_VERIFICATION.verified:
      return 'Verified';
    case SERVICE_VERIFICATION.notAccepted:
      return 'Not Accepted';
    case SERVICE_VERIFICATION.inProgress:
    default:
      return 'In Progress';
  }
};

export const getServiceVerificationClasses = (status) => {
  switch (status) {
    case SERVICE_VERIFICATION.verified:
      return 'bg-success-subtle text-success border border-success-subtle';
    case SERVICE_VERIFICATION.notAccepted:
      return 'bg-danger-subtle text-danger border border-danger-subtle';
    case SERVICE_VERIFICATION.inProgress:
    default:
      return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
  }
};
