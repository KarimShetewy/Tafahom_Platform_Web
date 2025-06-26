import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../App';

const ProtectedRoute = ({ allowedUserTypes }) => {
    const { user } = useContext(AuthContext);

    // If user is not logged in, redirect to login page
    if (!user || !user.token) {
        return <Navigate to="/login" replace />;
    }

    // If user is logged in but their type is not allowed, redirect to home or an unauthorized page
    if (allowedUserTypes && !allowedUserTypes.includes(user.userType)) {
        // You can create an unauthorized page or redirect to home
        return <Navigate to="/" replace />; // Redirect to home for unauthorized users
    }

    // If user is logged in and their type is allowed, render the child routes
    return <Outlet />;
};

export default ProtectedRoute;
