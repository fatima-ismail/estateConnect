import { useEffect, useState } from 'react';
import UserContext from './UserContext';
import * as authServices from '../services/authServices';
import * as userServices from '../services/userServices';
import { normalizeUserRole } from '../utils/roles';

export const UserProvider = ({ children }) => {
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const restoreSession = async () => {
            const token = localStorage.getItem('estate_access_token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const user = normalizeUserRole(await authServices.getCurrentUser());
                if (isMounted) {
                    setCurrentUser(user);
                }
            } catch {
                localStorage.removeItem('estate_access_token');
                if (isMounted) {
                    setCurrentUser(null);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        const handleExpiredSession = () => setCurrentUser(null);
        window.addEventListener('estate-auth-expired', handleExpiredSession);
        restoreSession();

        return () => {
            isMounted = false;
            window.removeEventListener('estate-auth-expired', handleExpiredSession);
        };
    }, []);

    const refreshUsers = async () => {
        const response = await userServices.getAll();
        const usersData = Array.isArray(response)
            ? response.map(normalizeUserRole)
            : [];

        setUsers(usersData);
        return usersData;
    };

    const storeSession = ({ token, user }) => {
        const normalizedUser = normalizeUserRole(user);
        localStorage.setItem('estate_access_token', token);
        setCurrentUser(normalizedUser);
        return normalizedUser;
    };

    const login = async (email, password) => {
        return storeSession(await authServices.login(email.trim(), password));
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('estate_access_token');
    };

    const registerUser = async (userData) => {
        return storeSession(await authServices.register(userData));
    };

    const updateUser = async (userId, updatedData) => {
        await userServices.update(userId, updatedData);
        const updatedUser = normalizeUserRole(await authServices.getCurrentUser());
        setCurrentUser(updatedUser);
        return updatedUser;
    };

    const value = {
        users,
        currentUser,
        loading,
        login,
        logout,
        registerUser,
        updateUser,
        refreshUsers
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};
