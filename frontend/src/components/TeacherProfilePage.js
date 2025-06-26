import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import academicStructure from '../constants/academicStructure';
import DefaultUserImage from '../assets/images/default_user.png';
import CoursePlaceholder from '../assets/images/course_placeholder.jpg';
import { AuthContext, ToastContext } from '../App';

import './TeacherProfilePage.css'; // Specific CSS for this page
import './Dashboard.css'; // General grid/card styles (if not already included globally)

function TeacherProfilePage() {
    const { teacherId } = useParams();
    const { user } = useContext(AuthContext); // Current logged-in user
    const showGlobalToast = useContext(ToastContext);

    const [teacherProfile, setTeacherProfile] = useState(null);
    const [teacherCourses, setTeacherCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const userToken = user?.token;

    useEffect(() => {
        const fetchTeacherData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch teacher profile data
                const profileConfig = userToken ? { headers: { Authorization: `Token ${userToken}` } } : {};
                const profileResponse = await axios.get(`http://127.0.0.1:8000/api/users/teachers/${teacherId}/`, profileConfig);
                setTeacherProfile(profileResponse.data);

                // Fetch courses by this teacher
                const coursesResponse = await axios.get(`http://127.0.0.1:8000/api/courses/?teacher=${teacherId}&is_published=true`, profileConfig);
                setTeacherCourses(Array.isArray(coursesResponse.data.results) ? coursesResponse.data.results : coursesResponse.data);

            } catch (err) {
                console.error("Error fetching teacher profile or courses:", err);
                setError('فشل تحميل ملف تعريف المدرس أو كورساته.');
                showGlobalToast('فشل تحميل ملف تعريف المدرس.', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchTeacherData();
    }, [teacherId, userToken, showGlobalToast]);


    const buildFullUrl = (relativePath) => {
        if (!relativePath) return '';
        if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
            return relativePath;
        }
        return `http://127.0.0.1:8000${relativePath}`;
    };


    if (loading) {
        return (
            <div className="teacher-profile-page">
                <main className="main-content">
                    <div className="container loading-message-container">
                        <p>جاري تحميل ملف تعريف المدرس...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="teacher-profile-page">
                <main className="main-content">
                    <div className="container error-message-container">
                        <p className="error-message-box">{error}</p>
                        <Link to="/teachers-list" className="btn btn-primary">العودة لقائمة المدرسين</Link>
                    </div>
                </main>
            </div>
        );
    }

    if (!teacherProfile) {
        return (
            <div className="teacher-profile-page">
                <main className="main-content">
                    <div className="container">
                        <p className="error-message-box">لم يتم العثور على ملف تعريف المدرس.</p>
                        <Link to="/teachers-list" className="btn btn-primary">العودة لقائمة المدرسين</Link>
                    </div>
                </main>
            </div>
        );
    }

    const specializedSubjectLabel = academicStructure.allSubjectsMap[teacherProfile.specialized_subject]?.label || teacherProfile.specialized_subject;
    const genderLabel = academicStructure.genders[teacherProfile.gender]?.label || teacherProfile.gender;
    const governorateLabel = academicStructure.governorates[teacherProfile.governorate]?.label || teacherProfile.governorate;

    return (
        <div className="teacher-profile-page">
            <main className="main-content">
                <section className="teacher-hero-section">
                    <div className="container teacher-hero-container">
                        <div className="teacher-profile-image-wrapper">
                            <img src={teacherProfile.user_image || DefaultUserImage} alt={teacherProfile.first_name} className="teacher-profile-image" onError={(e) => { e.target.onerror = null; e.target.src = DefaultUserImage; }} />
                        </div>
                        <div className="teacher-info-content">
                            <h1>أ/ {teacherProfile.first_name} {teacherProfile.last_name}</h1>
                            <p className="teacher-specialty">{specializedSubjectLabel}</p>
                            <div className="teacher-contact-info">
                                {teacherProfile.phone_number && <span className="info-item">📞 {teacherProfile.phone_number}</span>}
                                {teacherProfile.email && <span className="info-item">✉️ {teacherProfile.email}</span>}
                                {genderLabel && <span className="info-item">🚻 {genderLabel}</span>}
                                {governorateLabel && <span className="info-item">📍 {governorateLabel}</span>}
                            </div>
                            <div className="teacher-social-links">
                                {teacherProfile.instagram_link && <a href={teacherProfile.instagram_link} target="_blank" rel="noopener noreferrer">Instagram</a>}
                                {teacherProfile.facebook_link && <a href={teacherProfile.facebook_link} target="_blank" rel="noopener noreferrer">Facebook</a>}
                                {teacherProfile.website_link && <a href={teacherProfile.website_link} target="_blank" rel="noopener noreferrer">Website</a>}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="teacher-section teacher-qualifications">
                    <div className="container">
                        <h2 className="section-title">المؤهلات والخبرات</h2>
                        <div className="content-box">
                            <h3>المؤهلات:</h3>
                            <p>{teacherProfile.qualifications || 'لا توجد مؤهلات مدخلة.'}</p>
                        </div>
                        <div className="content-box">
                            <h3>الخبرة:</h3>
                            <p>{teacherProfile.experience || 'لا توجد خبرة مدخلة.'}</p>
                        </div>
                        <div className="content-box">
                            <h3>ماذا سأقدم للمنصة:</h3>
                            <p>{teacherProfile.what_will_you_add || 'لم يتم تحديد ما سيقدمه.'}</p>
                        </div>
                    </div>
                </section>

                <section className="teacher-section teacher-courses">
                    <div className="container">
                        <h2 className="section-title">كورسات الأستاذ {teacherProfile.first_name}</h2>
                        {loading ? (
                            <p>جاري تحميل الكورسات...</p>
                        ) : error ? (
                            <p className="error-message-box">{error}</p>
                        ) : teacherCourses.length > 0 ? (
                            <div className="courses-grid">
                                {teacherCourses.map(course => (
                                    <Link to={`/course/${course.id}`} key={course.id} className="course-card">
                                        <img src={course.image_url ? buildFullUrl(course.image_url) : CoursePlaceholder} alt={course.title} className="course-image" onError={(e) => { e.target.onerror = null; e.target.src = CoursePlaceholder; }} />
                                        <div className="course-info">
                                            <h3 className="course-title">{course.title}</h3>
                                            <p className="course-teacher">أ/ {course.teacher_name} {course.teacher_last_name}</p>
                                            <p className="course-meta-info">{course.academic_level_display} - {course.subject_display}</p>
                                            <div className="course-actions">
                                                <span className="course-price">{course.price} ج.م.</span>
                                                {user && user.userType === 'student' && course.is_enrolled ? (
                                                    <span className="course-status enrolled">مشترك</span>
                                                ) : (
                                                    <span className="course-status not-enrolled">غير مشترك</span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p>لا يوجد كورسات متاحة حالياً لهذا المدرس.</p>
                        )}
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

export default TeacherProfilePage;
