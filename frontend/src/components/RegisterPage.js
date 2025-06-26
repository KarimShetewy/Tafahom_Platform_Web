import React from 'react';
import { Link } from 'react-router-dom';
import './RegisterPage.css';
import RegisterIllustration from '../assets/images/register_illustration.png'; // Make sure this path is correct

function RegisterPage() {
    return (
        <div className="register-page">
            <main className="main-content">
                <section className="register-selection-section">
                    <div className="container register-selection-container">
                        <div className="register-selection-image-wrapper">
                            <img src={RegisterIllustration} alt="Register Illustration" className="register-illustration" />
                            <h3 className="image-title">انضم إلينا في منصة تفاهم!</h3>
                        </div>
                        <div className="register-selection-form-wrapper">
                            <h2>إنشاء حساب جديد</h2>
                            <p className="selection-description">
                                اختر نوع الحساب الذي تود إنشاءه.
                            </p>
                            <div className="selection-options">
                                <Link to="/register/student" className="btn selection-btn student-btn">
                                    أنا طالب
                                </Link>
                                <Link to="/register/teacher" className="btn selection-btn teacher-btn">
                                    أنا أستاذ
                                </Link>
                                <Link to="/register/team" className="btn selection-btn team-btn">
                                    عضو فريق عمل
                                </Link>
                            </div>
                            <p className="login-prompt">
                                لديك حساب بالفعل؟ <Link to="/login" className="login-link">تسجيل الدخول</Link>
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            <footer>
                <div className="container">
                    <p>&copy; 2025 تفاهم. جميع الحقوق محفوظة.</p>
                </div>
            </footer>
        </div>
    );
}

export default RegisterPage;
