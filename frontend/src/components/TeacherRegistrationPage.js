import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import academicStructure from '../constants/academicStructure';
import { ToastContext } from '../App';
import LoginIllustration from '../assets/images/login_illustration.png'; 

function TeacherRegistrationPage() {
    const navigate = useNavigate();
    const showGlobalToast = useContext(ToastContext);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        password_confirm: '',
        user_type: 'teacher', // Fixed for teacher registration
        first_name: '',
        last_name: '',
        phone_number: '',
        gender: '',
        governorate: '',
        specialized_subject: '', // Specific to teacher
        qualifications: '', // Specific to teacher
        experience: '', // Specific to teacher
        what_will_you_add: '', // Specific to teacher
        instagram_link: '',
        facebook_link: '',
        website_link: '',
        personal_id_card: null, // File input
        cv_file: null, // File input
    });

    const [currentSection, setCurrentSection] = useState(1);
    const totalSections = 3;
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

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

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files.length > 0) {
            setFormData(prevData => ({
                ...prevData,
                [name]: files[0]
            }));
            if (errors[name]) {
                setErrors(prevErrors => {
                    const newErrors = { ...prevErrors };
                    delete newErrors[name];
                    return newErrors;
                });
            }
        } else {
            setFormData(prevData => ({
                ...prevData,
                [name]: null
            }));
        }
    };

    const validateSection = () => {
        let currentErrors = {};
        if (currentSection === 1) {
            if (!formData.first_name) currentErrors.first_name = 'الاسم الأول مطلوب';
            if (!formData.last_name) currentErrors.last_name = 'الاسم الأخير مطلوب';
            if (!formData.phone_number) currentErrors.phone_number = 'رقم الهاتف مطلوب';
            if (!formData.gender) currentErrors.gender = 'الجنس مطلوب';
            if (!formData.governorate) currentErrors.governorate = 'المحافظة مطلوبة';
            if (!formData.specialized_subject) currentErrors.specialized_subject = 'المادة المتخصصة مطلوبة';
        } else if (currentSection === 2) {
            if (!formData.email) currentErrors.email = 'البريد الإلكتروني مطلوب';
            if (!formData.password) currentErrors.password = 'كلمة المرور مطلوبة';
            if (!formData.password_confirm) currentErrors.password_confirm = 'تأكيد كلمة المرور مطلوب';
            if (formData.password && formData.password_confirm && formData.password !== formData.password_confirm) {
                currentErrors.password_confirm = 'كلمتا المرور غير متطابقتين';
            }
            if (!formData.qualifications) currentErrors.qualifications = 'المؤهلات مطلوبة';
            if (!formData.experience) currentErrors.experience = 'الخبرة مطلوبة';
            if (!formData.what_will_you_add) currentErrors.what_will_you_add = 'ما ستقدمه للمنصة مطلوب';
        } else if (currentSection === 3) {
            if (!formData.personal_id_card) currentErrors.personal_id_card = 'صورة البطاقة الشخصية مطلوبة';
            if (!formData.cv_file) currentErrors.cv_file = 'ملف السيرة الذاتية مطلوب';
        }
        setErrors(currentErrors);
        return Object.keys(currentErrors).length === 0;
    };

    const handleNextSection = () => {
        if (validateSection()) {
            if (currentSection < totalSections) {
                setCurrentSection(currentSection + 1);
                setErrors({});
            }
        } else {
            showGlobalToast('الرجاء ملء جميع الحقول المطلوبة في هذا القسم قبل المتابعة.', 'warning');
        }
    };

    const handlePrevSection = () => {
        if (currentSection > 1) {
            setCurrentSection(currentSection - 1);
            setErrors({});
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        if (!validateSection()) {
            showGlobalToast('الرجاء مراجعة جميع الحقول المطلوبة في الأقسام قبل الإرسال.', 'warning');
            setLoading(false);
            return;
        }

        const apiEndpoint = 'http://127.0.0.1:8000/api/users/register/teacher/';
        const dataToSend = new FormData();

        for (const key in formData) {
            if (key === 'personal_id_card' || key === 'cv_file') {
                if (formData[key] instanceof File) {
                    dataToSend.append(key, formData[key]);
                }
            } else if (key === 'specialized_subject') { // Map specialized_subject to category_type for AccountRequest
                dataToSend.append('category_type', formData[key]);
            } else if (formData[key] !== null && formData[key] !== '' && formData[key] !== undefined) {
                dataToSend.append(key, formData[key]);
            }
        }
        dataToSend.append('user_type', formData.user_type);

        try {
            const response = await axios.post(apiEndpoint, dataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            showGlobalToast('تم إرسال طلب إنشاء حساب أستاذ بنجاح. سيتم مراجعته قريباً.', 'success');
            navigate('/login');

        } catch (err) {
            console.error("Registration error details:", err);
            let errorMessage = 'حدث خطأ أثناء إرسال طلب التسجيل. يرجى التحقق من البيانات والمحاولة مرة أخرى.';

            if (axios.isAxiosError(err) && err.response) {
                if (err.response.data) {
                    if (err.response.data.detail) {
                        errorMessage = err.response.data.detail;
                    } else if (typeof err.response.data === 'object') {
                        const fieldErrors = Object.entries(err.response.data)
                            .map(([field, messages]) => {
                                const fieldName = {
                                    email: 'البريد الإلكتروني', 'password': 'كلمة المرور', 'password_confirm': 'تأكيد كلمة المرور',
                                    'first_name': 'الاسم الأول', 'last_name': 'الاسم الأخير', 'phone_number': 'رقم الهاتف',
                                    'gender': 'الجنس', 'governorate': 'المحافظة', 'specialized_subject': 'المادة المتخصصة',
                                    'qualifications': 'المؤهلات', 'experience': 'الخبرة', 'what_will_you_add': 'ما ستقدمه للمنصة',
                                    'personal_id_card': 'البطاقة الشخصية', 'cv_file': 'السيرة الذاتية', 'non_field_errors': ''
                                }[field] || field;
                                return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
                            })
                            .join(' | ');
                        errorMessage = `خطأ في البيانات المدخلة:\n${fieldErrors}`;
                    } else {
                        errorMessage = `فشل التسجيل. استجابة غير متوقعة من الخادم (الحالة: ${err.response.status}).`;
                    }
                } else {
                    errorMessage = `خطأ في الخادم (الحالة: ${err.response.status}). يرجى المحاولة لاحقاً.`;
                }
            } else if (err.request) {
                errorMessage = 'لا يوجد استجابة من الخادم. يرجى التحقق من اتصالك بالإنترنت وأن الخادم يعمل.';
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
        <div className="teacher-registration-page">
            <main className="main-content">
                <section className="registration-section">
                    <div className="container registration-container">
                        <div className="registration-image-wrapper">
                            <img src={LoginIllustration} alt="Registration Illustration" className="registration-illustration" />
                            <h3 className="image-title">طلب إنشاء حساب أستاذ</h3>
                        </div>
                        <div className="registration-form-wrapper">
                            <h2>إنشاء حساب أستاذ</h2>

                            {/* Section Navigation Buttons */}
                            <div className="form-sections-nav">
                                <button type="button" onClick={() => setCurrentSection(1)} className={`section-nav-button ${currentSection === 1 ? 'active' : ''}`}>
                                    القسم الأول
                                </button>
                                <button type="button" onClick={() => setCurrentSection(2)} className={`section-nav-button ${currentSection === 2 ? 'active' : ''}`}>
                                    القسم الثاني
                                </button>
                                <button type="button" onClick={() => setCurrentSection(3)} className={`section-nav-button ${currentSection === 3 ? 'active' : ''}`}>
                                    القسم الأخير
                                </button>
                            </div>

                            {errors.general && <div className="error-message-box">{errors.general}</div>}

                            <form className="teacher-register-form" onSubmit={handleSubmit}>
                                {/* Section 1: Personal Info & Subject */}
                                {currentSection === 1 && (
                                    <div className="form-section-content active-section">
                                        <h3>القسم الأول: معلومات شخصية وتخصص</h3>
                                        <div className="form-group">
                                            <label htmlFor="first_name">الاسم الأول:</label>
                                            <input type="text" id="first_name" name="first_name" value={formData.first_name} onChange={handleInputChange} required />
                                            {errors.first_name && <span className="error-message">{errors.first_name}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="last_name">الاسم الأخير:</label>
                                            <input type="text" id="last_name" name="last_name" value={formData.last_name} onChange={handleInputChange} required />
                                            {errors.last_name && <span className="error-message">{errors.last_name}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="phone_number">رقم الهاتف:</label>
                                            <input type="tel" id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleInputChange} required />
                                            {errors.phone_number && <span className="error-message">{errors.phone_number}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="gender">الجنس:</label>
                                            <select id="gender" name="gender" value={formData.gender} onChange={handleInputChange} required>
                                                <option value="">اختر الجنس</option>
                                                {academicStructure.genders && Object.keys(academicStructure.genders).map(key => (
                                                    <option key={key} value={key}>{academicStructure.genders[key].label}</option>
                                                ))}
                                            </select>
                                            {errors.gender && <span className="error-message">{errors.gender}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="governorate">المحافظة:</label>
                                            <select id="governorate" name="governorate" value={formData.governorate} onChange={handleInputChange} required>
                                                <option value="">اختر المحافظة</option>
                                                {academicStructure.governorates && Object.keys(academicStructure.governorates).map(key => (
                                                    <option key={key} value={key}>{academicStructure.governorates[key].label}</option>
                                                ))}
                                            </select>
                                            {errors.governorate && <span className="error-message">{errors.governorate}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="specialized_subject">المادة المتخصصة:</label>
                                            <select id="specialized_subject" name="specialized_subject" value={formData.specialized_subject} onChange={handleInputChange} required>
                                                <option value="">اختر المادة</option>
                                                {academicStructure.subjects && Object.keys(academicStructure.subjects).map(key => (
                                                    <option key={key} value={key}>{academicStructure.subjects[key].label}</option>
                                                ))}
                                            </select>
                                            {errors.specialized_subject && <span className="error-message">{errors.specialized_subject}</span>}
                                        </div>
                                        <button type="button" onClick={handleNextSection} className="btn btn-primary form-nav-btn">التالي</button>
                                    </div>
                                )}

                                {/* Section 2: Account Credentials & Qualifications */}
                                {currentSection === 2 && (
                                    <div className="form-section-content active-section">
                                        <h3>القسم الثاني: بيانات الحساب والمؤهلات</h3>
                                        <div className="form-group">
                                            <label htmlFor="email">البريد الإلكتروني:</label>
                                            <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required />
                                            {errors.email && <span className="error-message">{errors.email}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="password">كلمة المرور:</label>
                                            <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} required />
                                            {errors.password && <span className="error-message">{errors.password}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="password_confirm">تأكيد كلمة المرور:</label>
                                            <input type="password" id="password_confirm" name="password_confirm" value={formData.password_confirm} onChange={handleInputChange} required />
                                            {errors.password_confirm && <span className="error-message">{errors.password_confirm}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="qualifications">المؤهلات:</label>
                                            <textarea id="qualifications" name="qualifications" value={formData.qualifications} onChange={handleInputChange} required></textarea>
                                            {errors.qualifications && <span className="error-message">{errors.qualifications}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="experience">الخبرة:</label>
                                            <textarea id="experience" name="experience" value={formData.experience} onChange={handleInputChange} required></textarea>
                                            {errors.experience && <span className="error-message">{errors.experience}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="what_will_you_add">ماذا ستقدم للمنصة؟</label>
                                            <textarea id="what_will_you_add" name="what_will_you_add" value={formData.what_will_you_add} onChange={handleInputChange} required></textarea>
                                            {errors.what_will_you_add && <span className="error-message">{errors.what_will_you_add}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="instagram_link">رابط انستجرام (اختياري):</label>
                                            <input type="url" id="instagram_link" name="instagram_link" value={formData.instagram_link} onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="facebook_link">رابط فيسبوك (اختياري):</label>
                                            <input type="url" id="facebook_link" name="facebook_link" value={formData.facebook_link} onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="website_link">رابط الموقع الشخصي (اختياري):</label>
                                            <input type="url" id="website_link" name="website_link" value={formData.website_link} onChange={handleInputChange} />
                                        </div>
                                        <button type="button" onClick={handlePrevSection} className="btn btn-secondary form-nav-btn">السابق</button>
                                        <button type="button" onClick={handleNextSection} className="btn btn-primary form-nav-btn">التالي</button>
                                    </div>
                                )}

                                {/* Section 3: Document Upload */}
                                {currentSection === 3 && (
                                    <div className="form-section-content active-section">
                                        <h3>القسم الأخير: رفع المستندات</h3>
                                        <div className="form-group upload-group">
                                            <label htmlFor="personal_id_card">صورة البطاقة الشخصية (صورة واضحة للوجهين):</label>
                                            <input type="file" id="personal_id_card" name="personal_id_card" accept="image/*,.pdf" onChange={handleFileChange} required />
                                            {errors.personal_id_card && <span className="error-message">{errors.personal_id_card}</span>}
                                        </div>
                                        <div className="form-group upload-group">
                                            <label htmlFor="cv_file">ملف السيرة الذاتية (PDF):</label>
                                            <input type="file" id="cv_file" name="cv_file" accept=".pdf" onChange={handleFileChange} required />
                                            {errors.cv_file && <span className="error-message">{errors.cv_file}</span>}
                                        </div>
                                        <button type="button" onClick={handlePrevSection} className="btn btn-secondary form-nav-btn">السابق</button>
                                        <button type="submit" disabled={loading} className="btn btn-primary submit-btn">
                                            {loading ? 'جاري الإرسال...' : 'طلب إنشاء حساب'}
                                        </button>
                                    </div>
                                )}
                            </form>
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

export default TeacherRegistrationPage;
