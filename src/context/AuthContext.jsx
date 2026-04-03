import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkUserSession = async () => {
        try {
            // Ask your BACKEND if the cookie is valid
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/me`, {
                method: 'GET',
                credentials: 'include' // This is the secret sauce that sends the cookie
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (err) {
            console.error("Auth session check failed:", err);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkUserSession();
    }, []);

    // Also include a logout function that clears the cookie
    const logout = async () => {
        await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);