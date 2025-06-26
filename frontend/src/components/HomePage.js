import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, ToastContext } from '../App'; // استيراد ToastContext
import CoursePlaceholder from '../assets/images/course_placeholder.jpg';
import DefaultUserImage from '../assets/images/default_user.png';
import academicStructure from '../constants/academicStructure';

import './HomePage.css';
import './CourseDetailPage.css'; // For course cards styling, if reused
import './Dashboard.css'; // For general dashboard-like styling, if reused

function HomePage() {
    const { user } = useContext(AuthContext); // جلب user من السياق
    const showGlobalToast = useContext(ToastContext);

    const [teachers, setTeachers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loadingTeachers, setLoadingTeachers] = useState(true);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [errorTeachers, setErrorTeachers] = useState(null);
    const [errorCourses, setErrorCourses] = useState(null);

    const [filterAcademicLevel, setFilterAcademicLevel] = useState('');
    const [filterSubject, setFilterSubject] = useState('');

    const userToken = user?.token; // Get token safely

    // Fetch Teachers
    useEffect(() => {
        const fetchTeachers = async () => {
            setLoadingTeachers(true);
            setErrorTeachers(null);
            try {
                const config = userToken ? { headers: { Authorization: `Token ${userToken}` } } : {};
                const response = await axios.get('http://127.0.0.1:8000/api/users/teachers/', config);
                // Ensure response.data.results is an array
                setTeachers(Array.isArray(response.data.results) ? response.data.results : response.data);
            } catch (err) {
                console.error("Error fetching teachers:", err);
                setErrorTeachers('فشل تحميل قائمة المدرسين.');
                showGlobalToast('فشل تحميل قائمة المدرسين.', 'error');
            } finally {
                setLoadingTeachers(false);
            }
        };
        fetchTeachers();
    }, [userToken, showGlobalToast]);

    // Fetch Courses based on filters
    useEffect(() => {
        const fetchCourses = async () => {
            setLoadingCourses(true);
            setErrorCourses(null);
            try {
                const config = userToken ? { headers: { Authorization: `Token ${userToken}` } } : {};
                const params = {};
                if (filterAcademicLevel) {
                    params.academic_level = filterAcademicLevel;
                }
                if (filterSubject) {
                    params.subject = filterSubject;
                }
                params.is_published = true; // Only show published courses on homepage

                const response = await axios.get('http://127.0.0.1:8000/api/courses/', { ...config, params });
                setCourses(Array.isArray(response.data.results) ? response.data.results : response.data);
            } catch (err) {
                console.error("Error fetching courses:", err);
                setErrorCourses('فشل تحميل قائمة الكورسات.');
                showGlobalToast('فشل تحميل قائمة الكورسات.', 'error');
            } finally {
                setLoadingCourses(false);
            }
        };
        fetchCourses();
    }, [filterAcademicLevel, filterSubject, userToken, showGlobalToast]);

    const handleAcademicLevelChange = (e) => {
        setFilterAcademicLevel(e.target.value);
    };

    const handleSubjectChange = (e) => {
        setFilterSubject(e.target.value);
    };

    const handleClearFilters = () => {
        setFilterAcademicLevel('');
        setFilterSubject('');
    };

    return (
        <div className="homepage">
            <main className="main-content">
                <section className="hero-section">
                    <div className="container hero-container">
                        <div className="hero-content">
                            <h1>منصة تفاهم التعليمية</h1>
                            <h3>بوابتك للتعلم المتميز والوصول إلى أفضل المعلمين في مختلف المواد والمراحل الدراسية.</h3>
                            <div className="hero-cta">
                                {user ? (
                                    <Link to={`/${user.userType}/dashboard`} className="btn btn-primary">لوحة التحكم الخاصة بي</Link>
                                ) : (
                                    <>
                                        <Link to="/register" className="btn btn-primary">ابدأ مجاناً</Link>
                                        <Link to="/login" className="btn btn-secondary">تسجيل الدخول</Link>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="hero-image-wrapper">
                            <img src={DefaultUserImage} alt="Hero Illustration" className="hero-image" />
                        </div>
                    </div>
                </section>

                <section className="homepage-section featured-teachers">
                    <div className="container">
                        <h2 className="section-title">معلمونا المتميزون</h2>
                        {loadingTeachers ? (
                            <p>جاري تحميل المدرسين...</p>
                        ) : errorTeachers ? (
                            <p className="error-message-box">{errorTeachers}</p>
                        ) : teachers.length > 0 ? (
                            <div className="teachers-grid">
                                {teachers.slice(0, 4).map(teacher => ( // Display first 4 teachers
                                    <Link to={`/teachers/${teacher.id}`} key={teacher.id} className="teacher-card">
                                        <img src={teacher.user_image || DefaultUserImage} alt={teacher.first_name} className="teacher-image" onError={(e) => { e.target.onerror = null; e.target.src = DefaultUserImage; }} />
                                        <h3>أ/ {teacher.first_name} {teacher.last_name}</h3>
                                        <p>{academicStructure.allSubjectsMap[teacher.specialized_subject]?.label || teacher.specialized_subject}</p>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p>لا يوجد مدرسون متاحون حالياً.</p>
                        )}
                        <div className="view-all-link">
                            <Link to="/teachers-list" className="btn btn-secondary">عرض جميع المدرسين</Link>
                        </div>
                    </div>
                </section>

                <section className="homepage-section featured-courses">
                    <div className="container">
                        <h2 className="section-title">كورساتنا المقترحة</h2>

                        <div className="courses-filter">
                            <select value={filterAcademicLevel} onChange={handleAcademicLevelChange} className="filter-select">
                                <option value="">جميع الصفوف الدراسية</option>
                                {academicStructure.academicLevels && Object.keys(academicStructure.academicLevels).map(levelKey => (
                                    <option key={levelKey} value={levelKey}>{academicStructure.academicLevels[levelKey].label}</option>
                                ))}
                            </select>
                            <select value={filterSubject} onChange={handleSubjectChange} className="filter-select">
                                <option value="">جميع المواد</option>
                                {academicStructure.subjects && Object.keys(academicStructure.subjects).map(subjectKey => (
                                    <option key={subjectKey} value={subjectKey}>{academicStructure.subjects[subjectKey].label}</option>
                                ))}
                            </select>
                            <button onClick={handleClearFilters} className="btn btn-secondary clear-filter-btn">مسح الفلاتر</button>
                        </div>

                        {loadingCourses ? (
                            <p>جاري تحميل الكورسات...</p>
                        ) : errorCourses ? (
                            <p className="error-message-box">{errorCourses}</p>
                        ) : courses.length > 0 ? (
                            <div className="courses-grid">
                                {courses.map(course => (
                                    <Link to={`/course/${course.id}`} key={course.id} className="course-card">
                                        <img src={course.image_url ? `http://127.0.0.1:8000${course.image_url}` : CoursePlaceholder} alt={course.title} className="course-image" onError={(e) => { e.target.onerror = null; e.target.src = CoursePlaceholder; }} />
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
                            <p>لا توجد كورسات متاحة حالياً بالمعايير المختارة.</p>
                        )}
                        <div className="view-all-link">
                            <Link to="/courses" className="btn btn-primary">عرض جميع الكورسات</Link>
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

export default HomePage;
