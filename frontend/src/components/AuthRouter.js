import React, { useState, useEffect, createContext, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// استيراد AuthContext و ToastContext من App.js (حيث تم تعريفهما وتصديرهما)
import { AuthContext, ToastContext } from '../App';


const AuthRouter = ({ children, userProp, setUserProp }) => {
    const navigate = useNavigate();
    const showGlobalToast = useContext(ToastContext);

    const user = userProp;
    const setUser = setUserProp;

    const logout = useCallback(() => {
        sessionStorage.clear();
        setUser(null);
        showGlobalToast('تم تسجيل الخروج بنجاح!', 'info');
        navigate('/login');
    }, [setUser, showGlobalToast, navigate]);

    const login = (userData) => {
        sessionStorage.setItem('userToken', userData.token);
        sessionStorage.setItem('userType', userData.userType);
        sessionStorage.setItem('firstName', userData.firstName);
        sessionStorage.setItem('lastName', userData.lastName);
        sessionStorage.setItem('userImage', userData.userImage || '');
        sessionStorage.setItem('userId', userData.userId);
        sessionStorage.setItem('userBalance', userData.balance !== undefined ? userData.balance.toString() : '0');
        setUser(userData);
    };

    // إعداد Axios للتعامل مع CSRF Token ومعالجة الأخطاء
    useEffect(() => {
        const getCookie = (name) => {
            let cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        };

        axios.defaults.xsrfCookieName = 'csrftoken';
        axios.defaults.xsrfHeaderName = 'X-CSRFToken';
        axios.defaults.withCredentials = true;

        const csrftoken = getCookie('csrftoken');
        if (csrftoken) {
            axios.defaults.headers.common['X-CSRFToken'] = csrftoken;
        } else {
            console.warn("CSRFToken cookie not found. This might lead to 403 Forbidden errors for POST requests.");
        }

        // اعتراض استجابات Axios لمعالجة الأخطاء العامة (خاصة 401/403)
        const interceptor = axios.interceptors.response.use(response => {
            return response;
        }, error => {
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                if (error.response.data && error.response.data.detail && error.response.data.detail.includes("CSRF Failed: CSRF cookie not set.")) {
                    showGlobalToast('خطأ أمني (CSRF). يرجى تحديث الصفحة والمحاولة مرة أخرى.', 'error');
                } else if (error.response.data && error.response.data.detail) {
                    showGlobalToast(error.response.data.detail, 'error');
                } else {
                    showGlobalToast('غير مصرح لك بالوصول أو جلستك انتهت. يرجى تسجيل الدخول.', 'error');
                }
                logout();
            }
            return Promise.reject(error);
        });

        // تنظيف الـ interceptor عند إلغاء تحميل المكون
        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, [logout, showGlobalToast]);

    return (
        <AuthContext.Provider value={{ user, login, logout, navigate, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthRouter;
