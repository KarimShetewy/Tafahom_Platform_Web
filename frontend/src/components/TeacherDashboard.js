import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, ToastContext } from '../App';
import academicStructure from '../constants/academicStructure';

// You can use a placeholder image from your assets or a public URL
import CoursePlaceholder from '../assets/course-placeholder.png';

import './Dashboard.css'; // General dashboard styles

function TeacherDashboard() {
    const { user } = useContext(AuthContext);
    const showGlobalToast = useContext(ToastContext);
    const navigate = useNavigate();

    const [myCourses, setMyCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [errorCourses, setErrorCourses] = useState(null);

    const userToken = user?.token;

    useEffect(() => {
        const fetchMyCourses = async () => {
            setLoadingCourses(true);
            setErrorCourses(null);
            try {
                if (!userToken) {
                    setErrorCourses("الرجاء تسجيل الدخول لعرض كورساتك.");
                    return;
                }
                const response = await axios.get('http://127.0.0.1:8000/api/courses/my-courses/', {
                    headers: {
                        'Authorization': `Token ${userToken}`
                    }
                });
                setMyCourses(Array.isArray(response.data.results) ? response.data.results : response.data);
            } catch (err) {
                console.error("Error fetching my courses:", err);
                setErrorCourses('فشل تحميل كورساتك.');
                showGlobalToast('فشل تحميل كورساتك.', 'error');
            } finally {
                setLoadingCourses(false);
            }
        };

        if (user && user.userType === 'teacher') {
            fetchMyCourses();
        } else if (user) {
            setErrorCourses("ليس لديك صلاحية لعرض هذه الصفحة.");
            setLoadingCourses(false);
        } else {
            setErrorCourses("الرجاء تسجيل الدخول.");
            setLoadingCourses(false);
        }
        
    }, [user, userToken, showGlobalToast]);


    if (!user || user.userType !== 'teacher') {
        return (
            <div className="teacher-dashboard">
                <main className="main-content">
                    <div className="container dashboard-container">
                        <p className="error-message-box">ليس لديك صلاحية لعرض لوحة تحكم المعلم.</p>
                        <Link to="/login" className="btn btn-primary">تسجيل الدخول</Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="teacher-dashboard">
            <main className="main-content">
                <div className="container dashboard-container">
                    <h1>لوحة تحكم المعلم</h1>
                    <div className="dashboard-summary">
                        <div className="summary-card">
                            <h3>أهلاً بك، أستاذ {user.firstName}</h3>
                            <p>تخصصك: {academicStructure.allSubjectsMap[user.specialized_subject]?.label || user.specialized_subject}</p>
                        </div>
                        <div className="summary-card">
                            <h3>كورساتي</h3>
                            <p>{myCourses.length} كورس</p>
                        </div>
                        <div className="summary-card">
                            <h3>الطلاب المسجلين</h3>
                            <p>... (ميزة قريباً)</p>
                        </div>
                    </div>

                    <section className="dashboard-actions">
                        <h2>الإجراءات السريعة</h2>
                        <div className="action-buttons-grid">
                            <Link to="/teacher/add-course" className="btn btn-primary action-btn">إضافة كورس جديد</Link>
                            <Link to="/teacher/my-courses" className="btn btn-secondary action-btn">إدارة كورساتي</Link>
                            <Link to="/teacher/profile" className="btn btn-primary action-btn">تعديل ملفي الشخصي</Link>
                            <button className="btn btn-secondary action-btn">عرض تقارير الطلاب</button>
                        </div>
                    </section>

                    <section className="dashboard-sections">
                        <h2>كورساتي الأخيرة</h2>
                        {loadingCourses ? (
                            <p>جاري تحميل كورساتك...</p>
                        ) : errorCourses ? (
                            <p className="error-message-box">{errorCourses}</p>
                        ) : myCourses.length > 0 ? (
                            <div className="courses-grid">
                                {myCourses.slice(0, 3).map(course => ( // Display first 3 courses
                                    <Link to={`/course/${course.id}`} key={course.id} className="course-card">
                                        <img src={course.image_url ? `http://127.0.0.1:8000${course.image_url}` : CoursePlaceholder} alt={course.title} className="course-image" onError={(e) => { e.target.onerror = null; e.target.src = CoursePlaceholder; }} />
                                        <div className="course-info">
                                            <h3 className="course-title">{course.title}</h3>
                                            <p className="course-teacher">أ/ {course.teacher_name} {course.teacher_last_name}</p>
                                            <p className="course-meta-info">
                                                {academicStructure.academicLevels[course.academic_level]?.label || course.academic_level} - 
                                                {academicStructure.subjects[course.subject]?.label || course.subject}
                                            </p>
                                            <div className="course-actions">
                                                {course.is_published ? (
                                                    <span className="course-status published">منشور</span>
                                                ) : (
                                                    <span className="course-status draft">مسودة</span>
                                                )}
                                                <Link to={`/teacher/courses/${course.id}/manage-content`} className="btn btn-secondary btn-sm">إدارة</Link>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p>لم تقم بإنشاء أي كورسات بعد. <Link to="/teacher/add-course">ابدأ بإنشاء كورس جديد</Link>.</p>
                        )}
                    </section>
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

export default TeacherDashboard;
