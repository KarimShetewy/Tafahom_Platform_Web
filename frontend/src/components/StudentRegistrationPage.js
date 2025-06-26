import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import academicStructure from '../constants/academicStructure';
import { ToastContext } from '../App';
import LoginIllustration from '../assets/images/login_illustration.png'; 

function StudentRegistrationPage() {
    const navigate = useNavigate();
    const showGlobalToast = useContext(ToastContext);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        password_confirm: '',
        user_type: 'student', // Fixed for student registration
        first_name: '',
        second_name: '',
        third_name: '',
        last_name: '',
        phone_number: '',
        gender: '',
        governorate: '',
        parent_father_phone_number: '',
        parent_mother_phone_number: '',
        school_name: '',
        parent_profession: '',
        teacher_name_for_student: '',
        academic_level: '',
        academic_track: '',
        personal_id_card: null, // File input
        cv_file: null, // File input (optional for students, but included for completeness if needed)
    });

    const [currentSection, setCurrentSection] = useState(1);
    const totalSections = 3; // Total number of sections in the form
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
        // Clear error for the specific field when it changes
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
            if (!formData.academic_level) currentErrors.academic_level = 'الصف الدراسي مطلوب';
            if (!formData.academic_track) currentErrors.academic_track = 'المسار الدراسي مطلوب';
        } else if (currentSection === 2) {
            if (!formData.email) currentErrors.email = 'البريد الإلكتروني مطلوب';
            if (!formData.password) currentErrors.password = 'كلمة المرور مطلوبة';
            if (!formData.password_confirm) currentErrors.password_confirm = 'تأكيد كلمة المرور مطلوب';
            if (formData.password && formData.password_confirm && formData.password !== formData.password_confirm) {
                currentErrors.password_confirm = 'كلمتا المرور غير متطابقتين';
            }
            if (!formData.parent_father_phone_number) currentErrors.parent_father_phone_number = 'رقم هاتف الأب مطلوب';
            if (!formData.school_name) currentErrors.school_name = 'اسم المدرسة مطلوب';
            if (!formData.parent_profession) currentErrors.parent_profession = 'مهنة ولي الأمر مطلوبة';
        } else if (currentSection === 3) {
            if (!formData.personal_id_card) currentErrors.personal_id_card = 'صورة البطاقة الشخصية مطلوبة';
            // cv_file is optional for students, so no required validation
        }
        setErrors(currentErrors);
        return Object.keys(currentErrors).length === 0;
    };

    const handleNextSection = () => {
        if (validateSection()) {
            if (currentSection < totalSections) {
                setCurrentSection(currentSection + 1);
                setErrors({}); // Clear errors when moving to the next section
            }
        } else {
            showGlobalToast('الرجاء ملء جميع الحقول المطلوبة في هذا القسم قبل المتابعة.', 'warning');
        }
    };

    const handlePrevSection = () => {
        if (currentSection > 1) {
            setCurrentSection(currentSection - 1);
            setErrors({}); // Clear errors when moving back
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({}); // Clear previous errors

        if (!validateSection()) {
            showGlobalToast('الرجاء مراجعة جميع الحقول المطلوبة في الأقسام قبل الإرسال.', 'warning');
            setLoading(false);
            return;
        }

        const apiEndpoint = 'http://127.0.0.1:8000/api/users/register/student/';
        const dataToSend = new FormData();

        // Append all form fields
        for (const key in formData) {
            // Special handling for files
            if (key === 'personal_id_card' || key === 'cv_file') {
                if (formData[key] instanceof File) {
                    dataToSend.append(key, formData[key]);
                }
            } else if (formData[key] !== null && formData[key] !== '' && formData[key] !== undefined) {
                dataToSend.append(key, formData[key]);
            }
        }
        // Ensure user_type is always set
        dataToSend.append('user_type', formData.user_type);

        try {
            const response = await axios.post(apiEndpoint, dataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Important for file uploads
                },
            });

            showGlobalToast('تم إرسال طلب إنشاء حساب طالب بنجاح. سيتم مراجعته قريباً.', 'success');
            navigate('/login');

        } catch (err) {
            console.error("Registration error details:", err);
            let errorMessage = 'حدث خطأ أثناء إرسال طلب التسجيل. يرجى التحقق من البيانات والمحاولة مرة أخرى.';

            if (axios.isAxiosError(err) && err.response) {
                if (err.response.data) {
                    if (err.response.data.detail) {
                        errorMessage = err.response.data.detail;
                    } else if (typeof err.response.data === 'object') {
                        // Attempt to parse field-specific errors
                        const fieldErrors = Object.entries(err.response.data)
                            .map(([field, messages]) => {
                                // Map backend field names to more user-friendly labels
                                const fieldName = {
                                    email: 'البريد الإلكتروني', 'password': 'كلمة المرور', 'password_confirm': 'تأكيد كلمة المرور',
                                    'first_name': 'الاسم الأول', 'last_name': 'الاسم الأخير', 'phone_number': 'رقم الهاتف',
                                    'gender': 'الجنس', 'governorate': 'المحافظة', 'academic_level': 'الصف الدراسي',
                                    'academic_track': 'المسار الدراسي', 'second_name': 'الاسم الثاني (الأب)', 'third_name': 'الاسم الثالث (الجد)',
                                    'parent_father_phone_number': 'رقم هاتف الأب', 'parent_mother_phone_number': 'رقم هاتف الأم',
                                    'school_name': 'اسم المدرسة', 'parent_profession': 'مهنة ولي الأمر',
                                    'teacher_name_for_student': 'اسم الأستاذ للطالب',
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
        <div className="student-registration-page">
            <main className="main-content">
                <section className="registration-section">
                    <div className="container registration-container">
                        <div className="registration-image-wrapper">
                            <img src={LoginIllustration} alt="Registration Illustration" className="registration-illustration" />
                            <h3 className="image-title">طلب إنشاء حساب طالب</h3>
                        </div>
                        <div className="registration-form-wrapper">
                            <h2>إنشاء حساب طالب</h2>

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

                            <form className="student-register-form" onSubmit={handleSubmit}>
                                {/* Section 1: Personal Info */}
                                {currentSection === 1 && (
                                    <div className="form-section-content active-section">
                                        <h3>القسم الأول: معلومات شخصية</h3>
                                        <div className="form-group">
                                            <label htmlFor="first_name">الاسم الأول:</label>
                                            <input type="text" id="first_name" name="first_name" value={formData.first_name} onChange={handleInputChange} required />
                                            {errors.first_name && <span className="error-message">{errors.first_name}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="second_name">الاسم الثاني (الأب):</label>
                                            <input type="text" id="second_name" name="second_name" value={formData.second_name} onChange={handleInputChange} />
                                            {errors.second_name && <span className="error-message">{errors.second_name}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="third_name">الاسم الثالث (الجد):</label>
                                            <input type="text" id="third_name" name="third_name" value={formData.third_name} onChange={handleInputChange} />
                                            {errors.third_name && <span className="error-message">{errors.third_name}</span>}
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
                                        <button type="button" onClick={handleNextSection} className="btn btn-primary form-nav-btn">التالي</button>
                                    </div>
                                )}

                                {/* Section 2: Academic Info & Parent Contact */}
                                {currentSection === 2 && (
                                    <div className="form-section-content active-section">
                                        <h3>القسم الثاني: معلومات أكاديمية واتصال ولي الأمر</h3>
                                        <div className="form-group">
                                            <label htmlFor="academic_level">الصف الدراسي:</label>
                                            <select id="academic_level" name="academic_level" value={formData.academic_level} onChange={handleInputChange} required>
                                                <option value="">اختر الصف الدراسي</option>
                                                {academicStructure.academicLevels && Object.keys(academicStructure.academicLevels).map(levelKey => (
                                                    <option key={levelKey} value={levelKey}>{academicStructure.academicLevels[levelKey].label}</option>
                                                ))}
                                            </select>
                                            {errors.academic_level && <span className="error-message">{errors.academic_level}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="academic_track">المسار الدراسي:</label>
                                            <select id="academic_track" name="academic_track" value={formData.academic_track} onChange={handleInputChange} required>
                                                <option value="">اختر المسار الدراسي</option>
                                                {formData.academic_level && academicStructure.academicLevels[formData.academic_level]?.tracks &&
                                                    Object.keys(academicStructure.academicLevels[formData.academic_level].tracks).map(trackKey => (
                                                        <option key={trackKey} value={trackKey}>{academicStructure.academicLevels[formData.academic_level].tracks[trackKey].label}</option>
                                                    ))
                                                }
                                            </select>
                                            {errors.academic_track && <span className="error-message">{errors.academic_track}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="school_name">اسم المدرسة:</label>
                                            <input type="text" id="school_name" name="school_name" value={formData.school_name} onChange={handleInputChange} required />
                                            {errors.school_name && <span className="error-message">{errors.school_name}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="parent_profession">مهنة ولي الأمر:</label>
                                            <select id="parent_profession" name="parent_profession" value={formData.parent_profession} onChange={handleInputChange} required>
                                                <option value="">اختر مهنة ولي الأمر</option>
                                                {academicStructure.parentProfessions && Object.keys(academicStructure.parentProfessions).map(key => (
                                                    <option key={key} value={key}>{academicStructure.parentProfessions[key].label}</option>
                                                ))}
                                            </select>
                                            {errors.parent_profession && <span className="error-message">{errors.parent_profession}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="parent_father_phone_number">رقم هاتف الأب:</label>
                                            <input type="tel" id="parent_father_phone_number" name="parent_father_phone_number" value={formData.parent_father_phone_number} onChange={handleInputChange} required />
                                            {errors.parent_father_phone_number && <span className="error-message">{errors.parent_father_phone_number}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="parent_mother_phone_number">رقم هاتف الأم (اختياري):</label>
                                            <input type="tel" id="parent_mother_phone_number" name="parent_mother_phone_number" value={formData.parent_mother_phone_number} onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="teacher_name_for_student">اسم الأستاذ الذي رشحك (اختياري):</label>
                                            <input type="text" id="teacher_name_for_student" name="teacher_name_for_student" value={formData.teacher_name_for_student} onChange={handleInputChange} />
                                        </div>
                                        <button type="button" onClick={handlePrevSection} className="btn btn-secondary form-nav-btn">السابق</button>
                                        <button type="button" onClick={handleNextSection} className="btn btn-primary form-nav-btn">التالي</button>
                                    </div>
                                )}

                                {/* Section 3: Account Credentials & Documents */}
                                {currentSection === 3 && (
                                    <div className="form-section-content active-section">
                                        <h3>القسم الأخير: بيانات الحساب والمستندات</h3>
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
                                        <div className="form-group upload-group">
                                            <label htmlFor="personal_id_card">صورة البطاقة الشخصية/شهادة الميلاد:</label>
                                            <input type="file" id="personal_id_card" name="personal_id_card" accept="image/*,.pdf" onChange={handleFileChange} required />
                                            {errors.personal_id_card && <span className="error-message">{errors.personal_id_card}</span>}
                                        </div>
                                        <div className="form-group upload-group">
                                            <label htmlFor="cv_file">ملف السيرة الذاتية (اختياري - PDF):</label>
                                            <input type="file" id="cv_file" name="cv_file" accept=".pdf" onChange={handleFileChange} />
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

export default StudentRegistrationPage;
