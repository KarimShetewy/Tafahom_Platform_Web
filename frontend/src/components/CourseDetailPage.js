import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CoursePlaceholder from '../assets/images/course_placeholder.jpg'; // صورة Placeholder للكورسات
import academicStructure from '../constants/academicStructure';
import { ToastContext, AuthContext } from '../App';
import ReactPlayer from 'react-player';
import TafahomLogoWatermark from '../assets/images/tafahom_logo.png'; // استيراد لوجو تفاهم

// Icons (using simple emojis for now, can be replaced with actual icon libraries like Lucide React or FontAwesome)
const VIDEO_ICON = '▶️';
const PDF_ICON = '📄';
const QUIZ_ICON = '📝';
const EXAM_ICON = '🏅';
const LINK_ICON = '🔗';
const TEXT_ICON = '📖';
const BRANCH_ICON = '📂';
const LOCKED_ICON = '🔒';
const UNLOCKED_ICON = '🔓';

function CourseDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedLecture, setExpandedLecture] = useState(null);
    const [expandedMaterial, setExpandedMaterial] = useState(null);
    const [watermarkStyle, setWatermarkStyle] = useState({}); // حالة لموقع العلامة المائية الديناميكي


    const showGlobalToast = useContext(ToastContext);
    const { user, setUser } = useContext(AuthContext); 

    const userToken = user?.token;
    const userType = user?.userType;
    const currentUserId = user?.userId ? parseInt(user.userId) : null;
    const userBalance = user?.balance; // جلب رصيد المستخدم


    const isStudent = userType === 'student';
    const isTeacher = userType === 'teacher';

    // useEffect لتغيير موقع العلامة المائية كل 10 ثواني (الحواف الأربعة)
    useEffect(() => {
        if (user && user.firstName && (user.userType === 'teacher' || user.userType === 'student')) { // تأكد أن المستخدم مدرس أو طالب ومسجل دخول
            const corners = [
                { bottom: '3%', right: '3%', top: 'unset', left: 'unset' },     // أسفل يمين
                { bottom: '3%', left: '3%', top: 'unset', right: 'unset' },      // أسفل يسار
                { top: '3%', left: '3%', bottom: 'unset', right: 'unset' },         // أعلى يسار
                { top: '3%', right: '3%', bottom: 'unset', left: 'unset' },        // أعلى يمين
            ];
            let currentCornerIndex = 0;

            const moveWatermark = () => {
                const nextPosition = corners[currentCornerIndex];
                setWatermarkStyle(nextPosition);
                currentCornerIndex = (currentCornerIndex + 1) % corners.length;
            };

            moveWatermark();
            const intervalId = setInterval(moveWatermark, 10000);

            return () => clearInterval(intervalId);
        }
    }, [user]);


    useEffect(() => {
        const fetchCourseDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/courses/${id}/`, {
                    headers: {
                        'Authorization': userToken ? `Token ${userToken}` : ''
                    }
                });
                setCourse(response.data);

                console.log("--- CourseDetailPage Access Debug ---");
                console.log("User Type from Context:", userType);
                console.log("Current User ID from Context:", currentUserId, typeof currentUserId);
                console.log("Course Teacher ID from Backend:", response.data.teacher_id, typeof response.data.teacher_id);
                console.log("isTeacher (UserType === 'teacher'):", isTeacher);
                console.log("Course is_enrolled (if student):", response.data.is_enrolled);
                console.log("-----------------------------------");

            } catch (err) {
                console.error("Error fetching course details:", err.response ? err.response.data : err.message);
                let errorMessage = "فشل تحميل تفاصيل الكورس. يرجى المحاولة لاحقاً.";
                if (axios.isAxiosError(err) && err.response) {
                    if (err.response.status === 404) {
                        errorMessage = "لم يتم العثور على هذا الكورس.";
                    } else if (err.response.data && err.response.data.detail) {
                        errorMessage = err.response.data.detail;
                    }
                }
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        if (userToken) { // جلب تفاصيل الكورس فقط إذا كان المستخدم مصادقاً عليه
            fetchCourseDetails();
        } else {
            setLoading(false);
            setError("يجب تسجيل الدخول لعرض تفاصيل الكورس أو للاشتراك.");
        }

    }, [id, userToken, userType, currentUserId]); 

    const handleToggleLecture = (lectureId) => {
        setExpandedLecture(expandedLecture === lectureId ? null : lectureId);
        setExpandedMaterial(null);
    };

    const handleToggleMaterial = (materialId) => {
        setExpandedMaterial(expandedMaterial === materialId ? null : materialId);
    };

    const handleMaterialItemClick = (material, canAccessFullContent) => {
        if (material.type === 'branch' || canAccessFullContent) {
            handleToggleMaterial(material.id);
        } else {
            showGlobalToast('يجب الاشتراك في الكورس للوصول إلى هذا المحتوى.', 'warning');
        }
    };

    const buildFullUrl = (relativePath) => {
        if (!relativePath) return '';
        if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
            return relativePath;
        }
        return `http://127.0.0.1:8000${relativePath}`;
    };

    const getMaterialIcon = (type) => {
        switch (type) {
            case 'video': return VIDEO_ICON;
            case 'pdf': return PDF_ICON;
            case 'quiz': return QUIZ_ICON;
            case 'exam': return EXAM_ICON;
            case 'link': return LINK_ICON;
            case 'text': return TEXT_ICON;
            case 'branch': return BRANCH_ICON;
            default: return '❓';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'غير متاح';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('ar-EG', options);
    };

    const handleSubscribeClick = async () => {
        if (!user || user.userType !== 'student') {
            showGlobalToast('يجب تسجيل الدخول كطالب للاشتراك في الكورسات.', 'error');
            navigate('/login');
            return;
        }

        if (userBalance < course.price) {
            showGlobalToast(`رصيدك الحالي (${userBalance !== undefined ? userBalance.toFixed(2) : '0.00'} جنيه) غير كافٍ للاشتراك في هذا الكورس (${course.price} جنيه). يرجى شحن محفظتك.`, 'error');
            navigate('/wallet'); // توجيه لصفحة المحفظة
            return;
        }

        showGlobalToast(
            `هل أنت متأكد من الاشتراك في كورس "${course.title}" بمبلغ ${course.price} جنيه؟ سيتم خصم المبلغ من محفظتك.`,
            'confirm',
            async (confirmed) => {
                if (confirmed) {
                    setLoading(true);
                    try {
                        const response = await axios.post('http://127.0.0.1:8000/api/courses/enroll/', {
                            course: course.id // إرسال ID الكورس
                        }, {
                            headers: { 'Authorization': `Token ${userToken}` }
                        });

                        // تحديث بيانات المستخدم (الرصيد) في الـ Context و sessionStorage
                        const newBalance = response.data.new_balance;
                        setUser(prevUser => ({ ...prevUser, balance: newBalance }));
                        sessionStorage.setItem('userBalance', newBalance.toString());

                        // تحديث حالة is_enrolled للكورس محلياً
                        setCourse(prevCourse => ({ ...prevCourse, is_enrolled: true }));

                        showGlobalToast(response.data.message, 'success');
                    } catch (err) {
                        console.error("Enrollment error:", err.response ? err.response.data : err.message);
                        let errorMessage = 'فشل الاشتراك في الكورس. يرجى المحاولة مرة أخرى.';
                        if (axios.isAxiosError(err) && err.response && err.response.data) {
                            if (err.response.data.detail) {
                                errorMessage = err.response.data.detail;
                            } else if (typeof err.response.data === 'object') {
                                errorMessage = Object.values(err.response.data).map(msg => Array.isArray(msg) ? msg.join(', ') : msg).join(' | ');
                            }
                        }
                        showGlobalToast(errorMessage, 'error');
                    } finally {
                        setLoading(false);
                    }
                }
            }
        );
    };


    if (loading) {
        return (
            <div className="course-detail-page">
                <main className="main-content">
                    <div className="container loading-message-container">
                        <p>جاري تحميل تفاصيل الكورس...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="course-detail-page">
                <main className="main-content">
                    <div className="container error-message-container">
                        <p className="error-message-box">{error}</p>
                        <Link to="/courses" className="btn btn-primary">العودة لصفحة الكورسات</Link>
                    </div>
                </main>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="course-detail-page">
                <main className="main-content">
                    <div className="container">
                        <p className="error-message-box">لم يتم العثور على الكورس.</p>
                        <Link to="/courses" className="btn btn-primary">العودة لصفحة الكورسات</Link>
                    </div>
                </main>
            </div>
        );
    }


    const courseSubjectLabel = academicStructure.allSubjectsMap[course.subject]?.label || course.subject;
    const courseAcademicLevelLabel = academicStructure[course.academic_level]?.label || course.academic_level;

    const isCourseOwner = isTeacher && (parseInt(course.teacher_id) === currentUserId);
    const canAccessFullContent = isCourseOwner || isTeacher || (isStudent && course.is_enrolled);

    return (
        <div className="course-detail-page">
            <main className="main-content course-detail-content">
                <section className="course-hero-section">
                    <div className="container course-hero-container">
                        <div className="course-image-wrapper">
                            <img
                                src={course.image_url ? buildFullUrl(course.image_url) : CoursePlaceholder}
                                alt={course.title}
                                className="course-hero-image"
                                onError={(e) => { e.target.onerror = null; e.target.src = CoursePlaceholder; }}
                            />
                        </div>

                        <div className="course-hero-content">
                            <div className="course-hero-badge">{course.course_type_display}</div>
                            <h1 className="course-hero-title">{course.title}</h1>
                            <p className="course-hero-teacher">أ/ {course.teacher_name} {course.teacher_last_name}</p>
                            <div className="course-hero-meta">
                                <span className="meta-item-detail"><span className="icon">📚</span>{courseAcademicLevelLabel}</span>
                                <span className="meta-item-detail"><span className="icon">🎯</span>{courseSubjectLabel}</span>
                            </div>
                            <p className="course-hero-description">
                                {course.description}
                            </p>
                            <div className="course-hero-actions">
                                <span className="course-hero-price">{course.price} جنيه</span>
                                {isCourseOwner ? (
                                    <Link to={`/teacher/courses/${course.id}/manage-content`} className="btn btn-primary course-hero-action-btn">إدارة الكورس</Link>
                                ) : (canAccessFullContent) ? (
                                    <button className="btn btn-primary course-hero-action-btn" onClick={() => { showGlobalToast("يمكنك الوصول إلى المحتوى بالضغط على المحاضرات أدناه.", "info"); }}>الدخول للكورس</button>
                                ) : ( // هنا يتم تفعيل زر الاشتراك
                                    <button
                                        className="btn btn-primary course-hero-subscribe-btn"
                                        onClick={handleSubscribeClick}
                                        disabled={loading} // تعطيل الزر أثناء التحميل
                                    >
                                        اشترك الآن
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="course-hero-overlay"></div>
                </section>

                <section className="course-meta-details-section">
                    <div className="container">
                        <div className="meta-item">
                            <span className="meta-icon">🗓️</span>
                            <span className="meta-label">تاريخ إنشاء الكورس:</span>
                            <span className="meta-value">{formatDate(course.created_at)}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-icon">🔄</span>
                            <span className="meta-label">آخر تحديث للكورس:</span>
                            <span className="meta-value">{formatDate(course.updated_at)}</span>
                        </div>
                    </div>
                </section>

                <section className="course-content-section">
                    <div className="container">
                        <h2 className="section-title">محتوى الكورس</h2>
                        {isTeacher && !isCourseOwner && ( /* رسالة توضيحية للمدرس غير المالك */
                            <p className="teacher-access-note">كمدرس، يمكنك عرض هذا المحتوى مجاناً.</p>
                        )}
                        {course.lectures && course.lectures.length > 0 ? (
                            <div className="lectures-accordion">
                                {course.lectures.map((lecture) => (
                                    <div key={lecture.id} className={`lecture-item ${expandedLecture === lecture.id ? 'expanded' : ''}`}>
                                        <div className="lecture-header" onClick={() => handleToggleLecture(lecture.id)}>
                                            <h4>{lecture.order}. {lecture.title}</h4>
                                            <span className="lecture-toggle-icon">
                                                {expandedLecture === lecture.id ? '▲' : '▼'}
                                            </span>
                                        </div>
                                        {expandedLecture === lecture.id && (
                                            <div className="lecture-materials-list">
                                                {lecture.materials && lecture.materials.length > 0 ? (
                                                    lecture.materials.map(material => (
                                                        <React.Fragment key={material.id}>
                                                            <div
                                                                className={`material-item ${!canAccessFullContent && material.type !== 'branch' ? 'locked-content' : ''}`}
                                                                onClick={() => handleMaterialItemClick(material, canAccessFullContent)}
                                                            >
                                                                <span className="material-icon">{getMaterialIcon(material.type)}</span>
                                                                <span className="material-title">{material.title}</span>
                                                                {!canAccessFullContent && material.type !== 'branch' && (
                                                                    <span className="lock-icon">🔒</span>
                                                                )}
                                                            </div>
                                                            {expandedMaterial === material.id && (
                                                                <div className="material-details-expanded">
                                                                    {canAccessFullContent ? (
                                                                        <>
                                                                            {material.description && <p className="material-description-text">الوصف: {material.description}</p>}

                                                                            {material.type === 'video' && material.file_url && (
                                                                                <div className="material-video-player-wrapper">
                                                                                    <ReactPlayer
                                                                                        url={buildFullUrl(material.file_url)}
                                                                                        controls={true}
                                                                                        width="100%"
                                                                                        height="auto"
                                                                                        config={{
                                                                                            file: {
                                                                                                attributes: {
                                                                                                    controlsList: 'nodownload',
                                                                                                    disablePictureInPicture: true,
                                                                                                    onContextMenu: (e) => e.preventDefault(),
                                                                                                }
                                                                                            },
                                                                                            youtube: {
                                                                                                playerVars: {
                                                                                                    modestbranding: 1,
                                                                                                    rel: 0,
                                                                                                    showinfo: 0,
                                                                                                    fs: 0, // Disable fullscreen button
                                                                                                    iv_load_policy: 3 // Disable video annotations
                                                                                                }
                                                                                            }
                                                                                        }}
                                                                                    />
                                                                                    {user && (
                                                                                        <div className="video-watermark-logo-container" style={watermarkStyle}>
                                                                                            <img src={TafahomLogoWatermark} alt="Tafahom Watermark" className="video-watermark-logo" />
                                                                                        </div>
                                                                                    )}
                                                                                    <p className="security-note">ملاحظة: حماية الفيديو من التسجيل الكامل للشاشة صعبة جداً من خلال الويب.</p>
                                                                                </div>
                                                                            )}
                                                                            {material.type === 'pdf' && material.file_url && (
                                                                                <div className="material-pdf-viewer">
                                                                                    <iframe src={`${buildFullUrl(material.file_url)}#toolbar=0&navpanes=0&scrollbar=0`} title={material.title} width="100%" height="500px"></iframe>
                                                                                    <p className="security-note">ملاحظة: قد لا يتم منع تحميل/طباعة/نسخ ملفات PDF بالكامل من المتصفح.</p>
                                                                                </div>
                                                                            )}

                                                                            {material.type === 'link' && material.url && (
                                                                                <p className="material-detail-info">الرابط: <a href={buildFullUrl(material.url)} target="_blank" rel="noopener noreferrer" className="material-file-link">{material.url}</a></p>
                                                                            )}
                                                                            {material.type === 'text' && material.text_content && (
                                                                                <div className="material-detail-info">المحتوى النصي: <pre>{material.text_content}</pre></div>
                                                                            )}
                                                                            {(material.type === 'quiz' || material.type === 'exam') && material.quiz_details && (
                                                                                <div className="quiz-details-info">
                                                                                    <h5>تفاصيل الواجب/الامتحان:</h5>
                                                                                    <p>المدة: {material.quiz_details.duration_minutes || 'غير محدد'} دقيقة</p>
                                                                                    <p>نسبة النجاح: {material.quiz_details.passing_score_percentage || 'غير محدد'}%</p>
                                                                                    {material.quiz_details.questions && material.quiz_details.questions.length > 0 ? (
                                                                                        <div>
                                                                                            <h6>الأسئلة:</h6>
                                                                                            {material.quiz_details.questions.map((q, qIndex) => (
                                                                                                <div key={q.id || qIndex} className="quiz-question-display">
                                                                                                    <p><strong>{qIndex + 1}. {q.question_text}</strong> ({q.points} نقاط)</p>
                                                                                                    <ul>
                                                                                                        {q.choices.map((c, cIndex) => (
                                                                                                            <li key={c.id || cIndex} className={c.is_correct ? 'correct-choice' : ''}>
                                                                                                                {c.choice_text} {c.is_correct ? '(صحيح)' : ''}
                                                                                                            </li>
                                                                                                        ))}
                                                                                                    </ul>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <p>لا توجد أسئلة لهذا الواجب/الامتحان بعد.</p>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <p className="access-denied-message">الرجاء الاشتراك في الكورس لعرض هذا المحتوى.</p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </React.Fragment>
                                                    ))
                                                ) : (
                                                    <p>لا توجد مواد تعليمية في هذه المحاضرة.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>لا توجد محاضرات لهذا الكورس بعد.</p>
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

export default CourseDetailPage;
