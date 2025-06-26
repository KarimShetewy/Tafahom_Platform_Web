import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, ToastContext } from '../App';
import CoursePlaceholder from '../assets/images/course_placeholder.jpg';
import academicStructure from '../constants/academicStructure';

import './Dashboard.css'; // General dashboard styles
import './StudentDashboard.css'; // Student-specific styles (currently empty)

function StudentDashboard() {
    const { user } = useContext(AuthContext);
    const showGlobalToast = useContext(ToastContext);

    const [enrollments, setEnrollments] = useState([]);
    const [loadingEnrollments, setLoadingEnrollments] = useState(true);
    const [errorEnrollments, setErrorEnrollments] = useState(null);

    const userToken = user?.token;

    useEffect(() => {
        const fetchEnrollments = async () => {
            setLoadingEnrollments(true);
            setErrorEnrollments(null);
            try {
                if (!userToken) {
                    setErrorEnrollments("الرجاء تسجيل الدخول لعرض كورساتك.");
                    return;
                }
                const response = await axios.get('http://127.0.0.1:8000/api/courses/my-enrollments/', {
                    headers: {
                        'Authorization': `Token ${userToken}`
                    }
                });
                setEnrollments(Array.isArray(response.data.results) ? response.data.results : response.data);
            } catch (err) {
                console.error("Error fetching enrollments:", err);
                setErrorEnrollments('فشل تحميل الكورسات المشترك بها.');
                showGlobalToast('فشل تحميل الكورسات المشترك بها.', 'error');
            } finally {
                setLoadingEnrollments(false);
            }
        };

        if (user && user.userType === 'student') {
            fetchEnrollments();
        } else if (user) {
            setErrorEnrollments("ليس لديك صلاحية لعرض هذه الصفحة.");
            setLoadingEnrollments(false);
        } else {
            setErrorEnrollments("الرجاء تسجيل الدخول.");
            setLoadingEnrollments(false);
        }
        
    }, [user, userToken, showGlobalToast]);


    if (!user || user.userType !== 'student') {
        return (
            <div className="student-dashboard">
                <main className="main-content">
                    <div className="container dashboard-container">
                        <p className="error-message-box">ليس لديك صلاحية لعرض لوحة تحكم الطالب.</p>
                        <Link to="/login" className="btn btn-primary">تسجيل الدخول</Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="student-dashboard">
            <main className="main-content">
                <div className="container dashboard-container">
                    <h1>لوحة تحكم الطالب</h1>
                    <div className="dashboard-summary">
                        <div className="summary-card">
                            <h3>أهلاً بك، {user.firstName}</h3>
                            <p>أنت طالب في منصة تفاهم.</p>
                        </div>
                        <div className="summary-card">
                            <h3>كورساتي المشترك بها</h3>
                            <p>{enrollments.length} كورس</p>
                        </div>
                        <div className="summary-card">
                            <h3>رصيد محفظتي</h3>
                            <p>{(user.balance ?? 0).toFixed(2)} جنيه</p>
                            <Link to="/wallet" className="btn btn-secondary btn-sm mt-3">شحن المحفظة</Link>
                        </div>
                    </div>

                    <section className="dashboard-sections">
                        <h2>كورساتي</h2>
                        {loadingEnrollments ? (
                            <p>جاري تحميل كورساتك المشترك بها...</p>
                        ) : errorEnrollments ? (
                            <p className="error-message-box">{errorEnrollments}</p>
                        ) : enrollments.length > 0 ? (
                            <div className="courses-grid">
                                {enrollments.map(enrollment => (
                                    <Link to={`/course/${enrollment.course}`} key={enrollment.id} className="course-card">
                                        <img src={enrollment.course_image_url ? `http://127.0.0.1:8000${enrollment.course_image_url}` : CoursePlaceholder} alt={enrollment.course_title} className="course-image" onError={(e) => { e.target.onerror = null; e.target.src = CoursePlaceholder; }} />
                                        <div className="course-info">
                                            <h3 className="course-title">{enrollment.course_title}</h3>
                                            <p className="course-teacher">أ/ {enrollment.teacher_name} {enrollment.teacher_last_name}</p>
                                            <p className="course-meta-info">
                                                {academicStructure.academicLevels[enrollment.academic_level]?.label || enrollment.academic_level} - 
                                                {academicStructure.subjects[enrollment.subject]?.label || enrollment.subject}
                                            </p>
                                            <div className="course-actions">
                                                <span className="course-status enrolled">مشترك</span>
                                                <span className="course-enrollment-date">منذ {new Date(enrollment.enrollment_date).toLocaleDateString('ar-EG')}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p>لم تشترك في أي كورسات بعد. تصفح <Link to="/courses">الكورسات المتاحة</Link>.</p>
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

export default StudentDashboard;
