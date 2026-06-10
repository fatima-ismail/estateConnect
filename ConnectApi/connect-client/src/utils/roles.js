export const USER_ROLES = {
    admin: 'admin',
    subAdmin: 'subadmin',
    user: 'user',
    company: 'company'
};

export const normalizeRole = (role) => {
    const normalizedRole = role?.trim().toLowerCase();

    return Object.values(USER_ROLES).includes(normalizedRole)
        ? normalizedRole
        : USER_ROLES.user;
};

export const normalizeUserRole = (user) => ({
    ...user,
    role: normalizeRole(user.role)
});
