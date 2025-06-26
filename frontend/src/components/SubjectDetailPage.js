import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import academicStructure from '../constants/academicStructure';
import CoursePlaceholder from '../assets/images/course_placeholder.jpg';
import DefaultUserImage from '../assets/images/default_user.png';
import { ToastContext, AuthContext } from '../App';

import './SubjectDetailPage.css'; // Import specific CSS for this page
import './Dashboard.css'; // For general grid/card styles (if not already included globally)

function SubjectDetailPage() {
    const { levelKey, subjectName } = useParams();
    const { user } = useContext(AuthContext);
    const showGlobalToast = useContext(ToastContext);

    const [courses, setCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [errorCourses, setErrorCourses] = useState(null);

    const [teachers, setTeachers] = useState([]);
    const [loadingTeachers, setLoadingTeachers] = useState(true);
    const [errorTeachers, setErrorTeachers] = useState(null);

    const userToken = user?.token;

    const academicLevelLabel = academicStructure.academicLevels[levelKey]?.label || levelKey;
    const subjectLabel = academicStructure.subjects[subjectName]?.label || subjectName;

    useEffect(() => {
        const fetchCoursesAndTeachers = async () => {
            // Fetch Courses
            setLoadingCourses(true);
            setErrorCourses(null);
            try {
                const coursesConfig = userToken ? { headers: { Authorization: `Token ${userToken}` } } : {};
                const coursesParams = {
                    academic_level: levelKey,
                    subject: subjectName,
                    is_published: true, // Only show published courses
                };
                const coursesResponse = await axios.get('http://127.0.0.1:8000/api/courses/', { ...coursesConfig, params: coursesParams });
                setCourses(Array.isArray(coursesResponse.data.results) ? coursesResponse.data.results : coursesResponse.data);
            } catch (err) {
                console.error("Error fetching courses for subject:", err);
                setErrorCourses('فشل تحميل الكورسات لهذه المادة.');
                showGlobalToast('فشل تحميل الكورسات لهذه المادة.', 'error');
            } finally {
                setLoadingCourses(false);
            }

            // Fetch Teachers for this subject
            setLoadingTeachers(true);
            setErrorTeachers(null);
            try {
                const teachersConfig = userToken ? { headers: { Authorization: `Token ${userToken}` } } : {};
                const teachersParams = {
                    specialized_subject: subjectName,
                    user_type: 'teacher', // Ensure only teachers
                    is_active: true, // Only active teachers
                };
                const teachersResponse = await axios.get('http://127.0.0.1:8000/api/users/teachers/', { ...teachersConfig, params: teachersParams });
                setTeachers(Array.isArray(teachersResponse.data.results) ? teachersResponse.data.results : teachersResponse.data);
            } catch (err) {
                console.error("Error fetching teachers for subject:", err);
                setErrorTeachers('فشل تحميل المدرسين لهذه المادة.');
                showGlobalToast('فشل تحميل المدرسين لهذه المادة.', 'error');
            } finally {
                setLoadingTeachers(false);
            }
        };

        fetchCoursesAndTeachers();
    }, [levelKey, subjectName, userToken, showGlobalToast]);


    const buildFullUrl = (relativePath) => {
        if (!relativePath) return '';
        if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
            return relativePath;
        }
        return `http://127.0.0.1:8000${relativePath}`;
    };

    return (
        <div className="subject-detail-page">
            <main className="main-content">
                <section className="subject-hero-section">
                    <div className="container subject-hero-container">
                        <h1>مادة: {subjectLabel}</h1>
                        <p className="subject-level-info">الصف الدراسي: {academicLevelLabel}</p>
                        <p className="subject-description">
                            اكتشف جميع الكورسات والمدرسين المتاحين لمادة {subjectLabel} في مرحلة {academicLevelLabel}.
                        </p>
                        <div className="subject-cta">
                            <Link to="/courses" className="btn btn-primary">تصفح كل الكورسات</Link>
                            <Link to="/teachers-list" className="btn btn-secondary">تصفح كل المدرسين</Link>
                        </div>
                    </div>
                </section>

                <section className="subject-section courses-by-subject">
                    <div className="container">
                        <h2 className="section-title">الكورسات المتاحة في {subjectLabel}</h2>
                        {loadingCourses ? (
                            <p>جاري تحميل الكورسات...</p>
                        ) : errorCourses ? (
                            <p className="error-message-box">{errorCourses}</p>
                        ) : courses.length > 0 ? (
                            <div className="courses-grid">
                                {courses.map(course => (
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
                            <p>لا توجد كورسات متاحة لهذه المادة حالياً.</p>
                        )}
                    </div>
                </section>

                <section className="subject-section teachers-by-subject">
                    <div className="container">
                        <h2 className="section-title">مدرسون متخصصون في {subjectLabel}</h2>
                        {loadingTeachers ? (
                            <p>جاري تحميل المدرسين...</p>
                        ) : errorTeachers ? (
                            <p className="error-message-box">{errorTeachers}</p>
                        ) : teachers.length > 0 ? (
                            <div className="teachers-grid">
                                {teachers.map(teacher => (
                                    <Link to={`/teachers/${teacher.id}`} key={teacher.id} className="teacher-card">
                                        <img src={teacher.user_image || DefaultUserImage} alt={teacher.first_name} className="teacher-image" onError={(e) => { e.target.onerror = null; e.target.src = DefaultUserImage; }} />
                                        <h3>أ/ {teacher.first_name} {teacher.last_name}</h3>
                                        <p>{academicStructure.allSubjectsMap[teacher.specialized_subject]?.label || teacher.specialized_subject}</p>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p>لا يوجد مدرسون متاحون لهذه المادة حالياً.</p>
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

export default SubjectDetailPage;
