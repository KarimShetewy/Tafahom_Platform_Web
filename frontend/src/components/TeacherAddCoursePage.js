import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import academicStructure from '../constants/academicStructure'; // Import academic structure
import { AuthContext, ToastContext } from '../App'; // Import AuthContext and ToastContext

import './TeacherAddCoursePage.css'; // Specific CSS for this page
import './Dashboard.css'; // General dashboard styles

function TeacherAddCoursePage() {
    const { user } = useContext(AuthContext); // Get user from AuthContext
    const showGlobalToast = useContext(ToastContext); // Get global toast

    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        academic_level: '',
        subject: '',
        course_type: 'regular',
        image: null, // For file input
        is_published: false,
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [teacherSubject, setTeacherSubject] = useState(''); // Teacher's specialized subject

    // Redirect if not a teacher
    useEffect(() => {
        if (!user || user.userType !== 'teacher') {
            showGlobalToast('ليس لديك صلاحية لإنشاء كورسات.', 'error');
            navigate('/login');
        } else {
            // Set teacher's specialized subject from user context
            setTeacherSubject(user.specialized_subject);
            // Pre-fill subject if available and disable it
            setFormData(prev => ({ ...prev, subject: user.specialized_subject || '' }));
        }
    }, [user, navigate, showGlobalToast]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value
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
        const file = e.target.files[0];
        setFormData(prevData => ({
            ...prevData,
            image: file
        }));
        if (errors.image) {
            setErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors.image;
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.title) newErrors.title = 'عنوان الكورس مطلوب.';
        if (!formData.description) newErrors.description = 'وصف الكورس مطلوب.';
        if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) < 0) newErrors.price = 'سعر الكورس غير صالح.';
        if (!formData.academic_level) newErrors.academic_level = 'الصف الدراسي مطلوب.';
        if (!formData.subject) newErrors.subject = 'المادة مطلوبة.';
        if (!formData.image) newErrors.image = 'صورة الكورس مطلوبة.';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            showGlobalToast('الرجاء مراجعة جميع الحقول المطلوبة.', 'warning');
            return;
        }

        setLoading(true);
        const dataToSend = new FormData();
        for (const key in formData) {
            if (formData[key] !== null && formData[key] !== undefined) {
                if (key === 'price') {
                    dataToSend.append(key, parseFloat(formData[key]).toFixed(2));
                } else if (typeof formData[key] === 'boolean') {
                    dataToSend.append(key, formData[key] ? 'true' : 'false');
                } else {
                    dataToSend.append(key, formData[key]);
                }
            }
        }

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Token ${user.token}`,
                },
            };
            const response = await axios.post('http://127.0.0.1:8000/api/courses/', dataToSend, config);
            showGlobalToast('تم إضافة الكورس بنجاح!', 'success');
            navigate(`/teacher/my-courses`); // Redirect to my courses page
        } catch (err) {
            console.error("Error adding course:", err.response ? err.response.data : err.message);
            let errorMessage = 'فشل إضافة الكورس. يرجى المحاولة مرة أخرى.';
            if (axios.isAxiosError(err) && err.response && err.response.data) {
                if (err.response.data.detail) {
                    errorMessage = err.response.data.detail;
                } else if (typeof err.response.data === 'object') {
                    const fieldErrors = Object.entries(err.response.data)
                        .map(([field, messages]) => {
                            const fieldName = {
                                title: 'العنوان', description: 'الوصف', price: 'السعر', 
                                academic_level: 'الصف الدراسي', subject: 'المادة', 
                                image: 'الصورة', is_published: 'الحالة', non_field_errors: ''
                            }[field] || field;
                            return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
                        })
                        .join(' | ');
                    errorMessage = `خطأ في البيانات المدخلة:\n${fieldErrors}`;
                }
            }
            setErrors({ general: errorMessage });
            showGlobalToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!user || user.userType !== 'teacher') {
        return (
            <div className="teacher-add-course-page">
                <main className="main-content">
                    <div className="container dashboard-container">
                        <p className="error-message-box">ليس لديك صلاحية لإنشاء الكورسات.</p>
                        <Link to="/login" className="btn btn-primary">تسجيل الدخول</Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="teacher-add-course-page">
            <main className="main-content">
                <div className="container dashboard-container">
                    <h1>إضافة كورس جديد</h1>
                    {errors.general && <div className="error-message-box">{errors.general}</div>}
                    <form className="add-course-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="title">عنوان الكورس:</label>
                            <input type="text" id="title" name="title" value={formData.title} onChange={handleInputChange} required />
                            {errors.title && <span className="error-message">{errors.title}</span>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="description">وصف الكورس:</label>
                            <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} required></textarea>
                            {errors.description && <span className="error-message">{errors.description}</span>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="price">سعر الكورس (بالجنيه):</label>
                            <input type="number" id="price" name="price" value={formData.price} onChange={handleInputChange} step="0.01" required />
                            {errors.price && <span className="error-message">{errors.price}</span>}
                        </div>
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
                            <label htmlFor="subject">المادة:</label>
                            {/* Subject is pre-filled from teacher's specialized subject */}
                            <select id="subject" name="subject" value={formData.subject} onChange={handleInputChange} required disabled={!!teacherSubject}>
                                <option value="">اختر المادة</option>
                                {academicStructure.subjects && Object.keys(academicStructure.subjects).map(subjectKey => (
                                    <option key={subjectKey} value={subjectKey}>{academicStructure.subjects[subjectKey].label}</option>
                                ))}
                            </select>
                            {errors.subject && <span className="error-message">{errors.subject}</span>}
                            {teacherSubject && <p className="form-note">مادتك المتخصصة: {academicStructure.subjects[teacherSubject]?.label || teacherSubject}</p>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="image">صورة الكورس:</label>
                            <input type="file" id="image" name="image" accept="image/*" onChange={handleFileChange} required />
                            {errors.image && <span className="error-message">{errors.image}</span>}
                        </div>
                        <div className="form-group checkbox-group">
                            <input type="checkbox" id="is_published" name="is_published" checked={formData.is_published} onChange={handleInputChange} />
                            <label htmlFor="is_published">نشر الكورس فوراً؟</label>
                        </div>
                        <button type="submit" disabled={loading} className="btn btn-primary submit-btn">
                            {loading ? 'جاري الإضافة...' : 'إضافة الكورس'}
                        </button>
                    </form>
                </div>
            </main>
            <footer>
                <div className="container">
                    <p>&copy; 2025 تفاهم. جميع الحقوق محفوظة.</p>
                </div>
            </footer>
        </div>
    );
}

export default TeacherAddCoursePage;
