import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import TafahomLogo from '../assets/images/tafahom_logo.png';
import DefaultUserImage from '../assets/images/default_user.png';

// استيراد الـ Context الذي يحمل بيانات المستخدم ودوال التوست
import { AuthContext, ToastContext } from '../App';
import './Navbar.css';

function Navbar() {
    const { user, logout, navigate } = useContext(AuthContext); 
    const showGlobalToast = useContext(ToastContext);

    const handleLogoutConfirm = () => {
        showGlobalToast(
            'هل أنت متأكد من تسجيل الخروج؟',
            'confirm',
            (confirmed) => {
                if (confirmed) {
                    logout();
                }
            }
        );
    };

    return (
        <header className="app-header">
            <div className="container">
                <nav className="navbar">
                    <div className="logo">
                        <Link to="/"><img src={TafahomLogo} alt="Tafahom Logo" className="navbar-logo" /></Link>
                    </div>
                    <ul className="nav-links">
                        <li><Link to="/">الرئيسية</Link></li>
                        {user && user.userType === 'teacher' && (
                            <>
                                <li><Link to="/teacher/dashboard">لوحة التحكم</Link></li>
                                <li><Link to="/teacher/add-course">إضافة كورس جديد</Link></li>
                                <li><Link to="/teacher/my-courses">إدارة كورساتي</Link></li>
                            </>
                        )}
                        {user && user.userType === 'student' && (
                            <>
                                <li><Link to="/student/dashboard">لوحة التحكم</Link></li>
                                <li>
                                    <Link to="/wallet" className="wallet-link">
                                        <span className="wallet-icon">💳</span> محفظتي
                                        <span className="wallet-balance">{(user.balance ?? 0).toFixed(2)} ج.م.</span> 
                                    </Link>
                                </li>
                            </>
                        )}
                        {user && user.userType === 'team_member' && (
                            <li><Link to="/team/dashboard">لوحة التحكم</Link></li>
                        )}
                        <li><Link to="/about">عن المنصة</Link></li>
                    </ul>
                    <div className="auth-buttons">
                        {user && user.userType ? ( 
                            <>
                                <div className="user-profile-widget">
                                    <img 
                                        src={user.userImage || DefaultUserImage} 
                                        alt={user.firstName} 
                                        className="user-profile-image" 
                                        onError={(e) => e.target.src = DefaultUserImage} 
                                    />
                                    <span className="user-profile-name">أهلاً، {user.firstName}</span>
                                </div>
                                <button onClick={handleLogoutConfirm} className="btn btn-secondary">تسجيل الخروج</button>
                            </>
                        ) : ( 
                            <>
                                <Link to="/login" className="btn btn-secondary">تسجيل الدخول</Link>
                                <Link to="/register/student" className="btn btn-primary">إنشاء حساب جديد</Link>
                            </>
                        )}
                    </div>
                </nav>
            </div>
        </header>
    );
}

export default Navbar;
