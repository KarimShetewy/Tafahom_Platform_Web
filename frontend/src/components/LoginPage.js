import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, ToastContext } from '../App';
import LoginIllustration from '../assets/images/login_illustration.png';
import './LoginPage.css';

function LoginPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext); // Access login function from AuthContext
    const showGlobalToast = useContext(ToastContext); // Access global toast

    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const response = await axios.post('http://127.0.0.1:8000/api/auth/token/login/', formData);
            const userData = {
                token: response.data.auth_token,
                userType: response.data.user_type,
                firstName: response.data.first_name,
                lastName: response.data.last_name,
                userImage: response.data.user_image, // Make sure your backend serializes this
                userId: response.data.user_id, // Make sure your backend serializes this
                balance: response.data.balance // Make sure your backend serializes this
            };
            login(userData); // Use login function from context
            showGlobalToast('تم تسجيل الدخول بنجاح!', 'success');

            // Redirect based on user type
            switch (userData.userType) {
                case 'student':
                    navigate('/student/dashboard');
                    break;
                case 'teacher':
                    navigate('/teacher/dashboard');
                    break;
                case 'team_member':
                case 'admin':
                    navigate('/team/dashboard'); // Assuming team_member and admin go to the same dashboard
                    break;
                default:
                    navigate('/');
            }

        } catch (err) {
            console.error("Login error details:", err);
            let errorMessage = 'فشل تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور.';

            if (axios.isAxiosError(err) && err.response) {
                if (err.response.data && err.response.data.non_field_errors) {
                    errorMessage = err.response.data.non_field_errors.join(' ');
                } else if (err.response.data && err.response.data.detail) {
                    errorMessage = err.response.data.detail;
                } else if (err.response.status === 400) {
                    errorMessage = 'بيانات غير صالحة. يرجى التحقق من المدخلات.';
                } else if (err.response.status === 401) {
                    errorMessage = 'بيانات الاعتماد غير صحيحة.';
                } else {
                    errorMessage = `خطأ في الخادم (الحالة: ${err.response.status}). يرجى المحاولة لاحقاً.`;
                }
            } else if (err.request) {
                errorMessage = 'لا يوجد استجابة من الخادم. يرجى التحقق من اتصالك بالإنترنت.';
            } else {
                errorMessage = 'حدث خطأ غير متوقع أثناء إرسال الطلب.';
            }

            setErrors({ general: errorMessage });
            showGlobalToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <main className="main-content">
                <section className="login-section">
                    <div className="container login-container">
                        <div className="login-image-wrapper">
                            <img src={LoginIllustration} alt="Login Illustration" className="login-illustration" />
                            <h3 className="image-title">أهلاً بعودتك لمنصة تفاهم!</h3>
                        </div>
                        <div className="login-form-wrapper">
                            <h2>تسجيل الدخول</h2>
                            {errors.general && <div className="error-message-box">{errors.general}</div>}
                            <form className="login-form" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label htmlFor="email">البريد الإلكتروني:</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    {errors.email && <span className="error-message">{errors.email}</span>}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="password">كلمة المرور:</label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    {errors.password && <span className="error-message">{errors.password}</span>}
                                </div>
                                <button type="submit" disabled={loading} className="btn btn-primary login-btn">
                                    {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                                </button>
                            </form>
                            <p className="register-prompt">
                                ليس لديك حساب؟ <Link to="/register" className="register-link">سجل الآن</Link>
                            </p>
                            <p className="forgot-password">
                                <Link to="/password/reset" className="forgot-password-link">نسيت كلمة المرور؟</Link>
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

export default LoginPage;
