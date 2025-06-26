import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, ToastContext } from '../App';
import CoursePlaceholder from '../assets/images/course_placeholder.jpg';
import academicStructure from '../constants/academicStructure';

import './TeacherMyCoursesPage.css'; // Specific CSS for this page
import './Dashboard.css'; // General dashboard styles

function TeacherMyCoursesPage() {
    const { user } = useContext(AuthContext);
    const showGlobalToast = useContext(ToastContext);
    const navigate = useNavigate();

    const [myCourses, setMyCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [errorCourses, setErrorCourses] = useState(null);

    const userToken = user?.token;

    // Move fetchMyCourses outside useEffect so it can be reused
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

    useEffect(() => {
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

    const handleDeleteCourse = async (courseId) => {
        showGlobalToast(
            'هل أنت متأكد من حذف هذا الكورس؟ سيتم حذف جميع المحاضرات والمواد المرتبطة به أيضاً!',
            'confirm',
            async (confirmed) => {
                if (confirmed) {
                    setLoadingCourses(true);
                    try {
                        await axios.delete(`http://127.0.0.1:8000/api/courses/${courseId}/`, {
                            headers: { Authorization: `Token ${userToken}` }
                        });
                        showGlobalToast('تم حذف الكورس بنجاح!', 'success');
                        fetchMyCourses(); // Refresh the list
                    } catch (err) {
                        console.error("Error deleting course:", err.response ? err.response.data : err.message);
                        showGlobalToast('فشل حذف الكورس.', 'error');
                    } finally {
                        setLoadingCourses(false);
                    }
                }
            }
        );
    };

    if (!user || user.userType !== 'teacher') {
        return (
            <div className="teacher-my-courses-page">
                <main className="main-content">
                    <div className="container dashboard-container">
                        <p className="error-message-box">ليس لديك صلاحية لعرض هذه الصفحة.</p>
                        <Link to="/login" className="btn btn-primary">تسجيل الدخول</Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="teacher-my-courses-page">
            <main className="main-content">
                <div className="container dashboard-container">
                    <h1>كورساتي</h1>
                    <div className="dashboard-actions">
                        <Link to="/teacher/add-course" className="btn btn-primary action-btn">إضافة كورس جديد</Link>
                    </div>

                    <section className="dashboard-sections">
                        <h2>جميع كورساتي</h2>
                        {loadingCourses ? (
                            <p>جاري تحميل كورساتك...</p>
                        ) : errorCourses ? (
                            <p className="error-message-box">{errorCourses}</p>
                        ) : myCourses.length > 0 ? (
                            <div className="courses-grid">
                                {myCourses.map(course => (
                                    <div key={course.id} className="course-card">
                                        <img src={course.image_url ? `http://127.0.0.1:8000${course.image_url}` : CoursePlaceholder} alt={course.title} className="course-image" onError={(e) => { e.target.onerror = null; e.target.src = CoursePlaceholder; }} />
                                        <div className="course-info">
                                            <h3 className="course-title">{course.title}</h3>
                                            <p className="course-teacher">أ/ {course.teacher_name} {course.teacher_last_name}</p>
                                            <p className="course-meta-info">
                                                {academicStructure.academicLevels[course.academic_level]?.label || course.academic_level} - 
                                                {academicStructure.subjects[course.subject]?.label || course.subject}
                                            </p>
                                            <div className="course-actions-teacher">
                                                {course.is_published ? (
                                                    <span className="course-status published">منشور</span>
                                                ) : (
                                                    <span className="course-status draft">مسودة</span>
                                                )}
                                                <Link to={`/teacher/courses/${course.id}/manage-content`} className="btn btn-secondary btn-sm">إدارة المحتوى</Link>
                                                <button onClick={() => handleDeleteCourse(course.id)} className="btn btn-delete btn-sm">حذف</button>
                                            </div>
                                        </div>
                                    </div>
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

export default TeacherMyCoursesPage;
