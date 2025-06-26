import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, ToastContext } from '../App';

import './TeacherManageCourseContentPage.css'; // Specific CSS for this page
import './Dashboard.css'; // General dashboard styles

// Icons for materials
const VIDEO_ICON = '▶️';
const PDF_ICON = '📄';
const QUIZ_ICON = '📝';
const EXAM_ICON = '🏅';
const LINK_ICON = '🔗';
const TEXT_ICON = '📖';
const BRANCH_ICON = '📂';

// Define academicStructure with materialTypes used in the form
const academicStructure = {
    materialTypes: {
        video: { label: 'فيديو' },
        pdf: { label: 'ملف PDF' },
        quiz: { label: 'اختبار' },
        exam: { label: 'امتحان' },
        link: { label: 'رابط خارجي' },
        text: { label: 'نص' },
        branch: { label: 'فرع' }
    }
};


function TeacherManageCourseContentPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const showGlobalToast = useContext(ToastContext);

    const [course, setCourse] = useState(null);
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [newLectureTitle, setNewLectureTitle] = useState('');
    const [newLectureOrder, setNewLectureOrder] = useState('');
    const [isLecturePublished, setIsLecturePublished] = useState(false);
    const [newLectureDescription, setNewLectureDescription] = useState('');
    const [newLectureLocked, setNewLectureLocked] = useState(false);
    const [requiredQuizForNewLecture, setRequiredQuizForNewLecture] = useState('');
    const [availableQuizzes, setAvailableQuizzes] = useState([]); // To populate the select for required quiz

    const [expandedLecture, setExpandedLecture] = useState(null);
    const [editingLectureId, setEditingLectureId] = useState(null);
    const [editingLectureData, setEditingLectureData] = useState({ title: '', description: '', order: '', is_published: false, is_locked: false, required_quiz_or_exam: null });

    const [editingMaterialId, setEditingMaterialId] = useState(null);
    const [editingMaterialData, setEditingMaterialData] = useState({ title: '', type: '', file: null, url: '', text_content: '', order: '', is_published: false, quiz_details: null });
    const [newMaterialType, setNewMaterialType] = useState(''); // For adding new material
    const [newMaterialData, setNewMaterialData] = useState({ title: '', type: '', file: null, url: '', text_content: '', order: '', is_published: false, quiz_details: null });
    const [showAddMaterialForm, setShowAddMaterialForm] = useState(null); // Lecture ID for which to show form

    // Quiz/Question states
    const [newQuizDetails, setNewQuizDetails] = useState({ duration_minutes: '', passing_score_percentage: '', questions: [] });
    const [editingQuizDetails, setEditingQuizDetails] = useState({ duration_minutes: '', passing_score_percentage: '', questions: [] });
    const [showQuizForm, setShowQuizForm] = useState(null); // Material ID for which to show quiz form

    const userToken = user?.token;

    const fetchCourseAndContent = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!userToken) {
                setError('الرجاء تسجيل الدخول.');
                setLoading(false);
                return;
            }

            // Fetch course details
            const courseResponse = await axios.get(`http://127.0.0.1:8000/api/courses/${courseId}/`, {
                headers: { Authorization: `Token ${userToken}` }
            });
            setCourse(courseResponse.data);

            // Fetch lectures (should be nested in courseResponse, but fetching separately for teacher management)
            const lecturesResponse = await axios.get(`http://127.0.0.1:8000/api/courses/${courseId}/lectures/`, {
                headers: { Authorization: `Token ${userToken}` }
            });
            setLectures(lecturesResponse.data);

            // Fetch all quizzes in this course for 'required_quiz' dropdown
            const allMaterialsResponse = await axios.get(`http://127.0.0.1:8000/api/courses/${courseId}/lectures/?all_materials=true`, {
                headers: { Authorization: `Token ${userToken}` }
            });
            // Flatten all quizzes from all lectures
            let quizzes = [];
            allMaterialsResponse.data.forEach(lecture => {
                lecture.materials.forEach(material => {
                    if ((material.type === 'quiz' || material.type === 'exam') && material.quiz_details) {
                        quizzes.push({
                            id: material.quiz_details.id,
                            title: material.title,
                            lecture_title: lecture.title,
                            type: material.type
                        });
                    }
                });
            });
            setAvailableQuizzes(quizzes);

        } catch (err) {
            console.error("Error fetching course content:", err.response ? err.response.data : err.message);
            setError('فشل تحميل محتوى الكورس.');
            showGlobalToast('فشل تحميل محتوى الكورس.', 'error');
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.userType === 'teacher' && user.userId === course?.teacher_id) {
            fetchCourseAndContent();
        } else if (user && user.userType === 'teacher') {
            // Allow other teachers to view, but not manage
            showGlobalToast("أنت مدرس، ولكن ليس مالك هذا الكورس. يمكنك فقط معاينة محتواه.", "info");
            navigate(`/course/${courseId}`); // Redirect to public course view
        } else {
            showGlobalToast('ليس لديك صلاحية لإنشاء كورسات.', 'error');
            navigate('/login');
        }
    }, [courseId, user, userToken, navigate, showGlobalToast]);


    const handleAddLecture = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                title: newLectureTitle,
                description: newLectureDescription,
                order: parseInt(newLectureOrder),
                is_published: isLecturePublished,
                is_locked: newLectureLocked,
                required_quiz_or_exam: newLectureLocked ? requiredQuizForNewLecture : null,
            };
            const response = await axios.post(`http://127.0.0.1:8000/api/courses/${courseId}/lectures/`, data, {
                headers: { Authorization: `Token ${userToken}` }
            });
            showGlobalToast('تم إضافة المحاضرة بنجاح!', 'success');
            setNewLectureTitle('');
            setNewLectureDescription('');
            setNewLectureOrder('');
            setIsLecturePublished(false);
            setNewLectureLocked(false);
            setRequiredQuizForNewLecture('');
            fetchCourseAndContent(); // Refresh content
        } catch (err) {
            console.error("Error adding lecture:", err.response ? err.response.data : err.message);
            showGlobalToast('فشل إضافة المحاضرة.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditLectureClick = (lecture) => {
        setEditingLectureId(lecture.id);
        setEditingLectureData({
            title: lecture.title,
            description: lecture.description,
            order: lecture.order,
            is_published: lecture.is_published,
            is_locked: lecture.is_locked,
            required_quiz_or_exam: lecture.required_quiz_or_exam,
        });
    };

    const handleUpdateLecture = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                ...editingLectureData,
                order: parseInt(editingLectureData.order), // Ensure order is int
                is_published: editingLectureData.is_published, // Ensure boolean
                is_locked: editingLectureData.is_locked, // Ensure boolean
            };
            const response = await axios.put(`http://127.0.0.1:8000/api/courses/lectures/${editingLectureId}/`, data, {
                headers: { Authorization: `Token ${userToken}` }
            });
            showGlobalToast('تم تحديث المحاضرة بنجاح!', 'success');
            setEditingLectureId(null);
            fetchCourseAndContent();
        } catch (err) {
            console.error("Error updating lecture:", err.response ? err.response.data : err.message);
            showGlobalToast('فشل تحديث المحاضرة.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLecture = async (lectureId) => {
        showGlobalToast(
            'هل أنت متأكد من حذف هذه المحاضرة؟ سيتم حذف جميع المواد التعليمية المرتبطة بها أيضاً!',
            'confirm',
            async (confirmed) => {
                if (confirmed) {
                    setLoading(true);
                    try {
                        await axios.delete(`http://127.0.0.1:8000/api/courses/lectures/${lectureId}/`, {
                            headers: { Authorization: `Token ${userToken}` }
                        });
                        showGlobalToast('تم حذف المحاضرة بنجاح!', 'success');
                        fetchCourseAndContent();
                    } catch (err) {
                        console.error("Error deleting lecture:", err.response ? err.response.data : err.message);
                        showGlobalToast('فشل حذف المحاضرة.', 'error');
                    } finally {
                        setLoading(false);
                    }
                }
            }
        );
    };

    // Material Management
    const handleAddMaterialClick = (lectureId) => {
        setShowAddMaterialForm(lectureId);
        setNewMaterialData({ title: '', type: '', file: null, url: '', text_content: '', order: '', is_published: false, quiz_details: null });
        setNewQuizDetails({ duration_minutes: '', passing_score_percentage: '', questions: [] });
    };

    const handleNewMaterialChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewMaterialData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleNewMaterialFileChange = (e) => {
        setNewMaterialData(prev => ({
            ...prev,
            file: e.target.files[0]
        }));
    };

    const handleNewQuizDetailsChange = (e) => {
        const { name, value } = e.target;
        setNewQuizDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleAddMaterialSubmit = async (e, lectureId) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            for (const key in newMaterialData) {
                if (newMaterialData[key] !== null && newMaterialData[key] !== undefined && newMaterialData[key] !== '') {
                    if (key === 'file' && newMaterialData[key] instanceof File) {
                        data.append(key, newMaterialData[key]);
                    } else if (key === 'quiz_details' && newMaterialData.type === ('quiz' || 'exam')) {
                        // For nested quiz_details, stringify and append
                        data.append('quiz_details', JSON.stringify({
                            duration_minutes: newQuizDetails.duration_minutes,
                            passing_score_percentage: newQuizDetails.passing_score_percentage,
                            // questions are added separately if needed via another API call
                        }));
                    } else {
                        data.append(key, newMaterialData[key]);
                    }
                }
            }
            data.append('order', parseInt(newMaterialData.order || 0)); // Ensure order is set

            const response = await axios.post(`http://127.0.0.1:8000/api/courses/lectures/${lectureId}/materials/`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Token ${userToken}`
                }
            });
            showGlobalToast('تم إضافة المادة بنجاح!', 'success');
            setShowAddMaterialForm(null);
            fetchCourseAndContent();
        } catch (err) {
            console.error("Error adding material:", err.response ? err.response.data : err.message);
            showGlobalToast('فشل إضافة المادة.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditMaterialClick = (material) => {
        setEditingMaterialId(material.id);
        setEditingMaterialData({
            title: material.title,
            type: material.type,
            file: null, // File input should be handled separately for existing files
            url: material.url,
            text_content: material.text_content,
            order: material.order,
            is_published: material.is_published,
            quiz_details: material.quiz_details, // Load existing quiz details
        });
        if (material.quiz_details) {
            setEditingQuizDetails({
                duration_minutes: material.quiz_details.duration_minutes || '',
                passing_score_percentage: material.quiz_details.passing_score_percentage || '',
                questions: material.quiz_details.questions || [] // Load existing questions
            });
        } else {
            setEditingQuizDetails({ duration_minutes: '', passing_score_percentage: '', questions: [] });
        }
    };

    const handleUpdateMaterial = async (e, materialId) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            for (const key in editingMaterialData) {
                if (key === 'file' && editingMaterialData[key] instanceof File) {
                    data.append(key, editingMaterialData[key]);
                } else if (key === 'quiz_details') {
                    if (editingMaterialData.type === 'quiz' || editingMaterialData.type === 'exam') {
                        data.append('quiz_details', JSON.stringify({
                            duration_minutes: editingQuizDetails.duration_minutes,
                            passing_score_percentage: editingQuizDetails.passing_score_percentage,
                            // Questions will be managed separately via Quiz/Question APIs
                        }));
                    }
                }
                else if (editingMaterialData[key] !== null && editingMaterialData[key] !== undefined && editingMaterialData[key] !== '') {
                    data.append(key, editingMaterialData[key]);
                }
            }
            data.append('order', parseInt(editingMaterialData.order || 0));

            const response = await axios.put(`http://127.0.0.1:8000/api/courses/materials/${materialId}/`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Token ${userToken}`
                }
            });
            showGlobalToast('تم تحديث المادة بنجاح!', 'success');
            setEditingMaterialId(null);
            fetchCourseAndContent();
        } catch (err) {
            console.error("Error updating material:", err.response ? err.response.data : err.message);
            showGlobalToast('فشل تحديث المادة.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMaterial = async (materialId) => {
        showGlobalToast(
            'هل أنت متأكد من حذف هذه المادة التعليمية؟',
            'confirm',
            async (confirmed) => {
                if (confirmed) {
                    setLoading(true);
                    try {
                        await axios.delete(`http://127.0.0.1:8000/api/courses/materials/${materialId}/`, {
                            headers: { Authorization: `Token ${userToken}` }
                        });
                        showGlobalToast('تم حذف المادة بنجاح!', 'success');
                        fetchCourseAndContent();
                    } catch (err) {
                        console.error("Error deleting material:", err.response ? err.response.data : err.message);
                        showGlobalToast('فشل حذف المادة.', 'error');
                    } finally {
                        setLoading(false);
                    }
                }
            }
        );
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


    if (loading) {
        return (
            <div className="teacher-manage-content-page">
                <main className="main-content">
                    <div className="container loading-message-container">
                        <p>جاري تحميل محتوى الكورس...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="teacher-manage-content-page">
                <main className="main-content">
                    <div className="container error-message-container">
                        <p className="error-message-box">{error}</p>
                        <Link to="/teacher/my-courses" className="btn btn-primary">العودة لكورساتي</Link>
                    </div>
                </main>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="teacher-manage-content-page">
                <main className="main-content">
                    <div className="container">
                        <p className="error-message-box">لم يتم العثور على هذا الكورس أو ليس لديك صلاحية لإدارته.</p>
                        <Link to="/teacher/my-courses" className="btn btn-primary">العودة لكورساتي</Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="teacher-manage-content-page">
            <main className="main-content">
                <div className="container dashboard-container">
                    <h1>إدارة محتوى الكورس: {course.title}</h1>
                    <p className="course-subtitle">المادة: {course.subject_display} | الصف: {course.academic_level_display}</p>

                    <section className="manage-lectures-section">
                        <h2>المحاضرات</h2>
                        <div className="lectures-list-container">
                            {lectures.length > 0 ? (
                                lectures.map(lecture => (
                                    <div key={lecture.id} className="lecture-management-item">
                                        <div className="lecture-summary">
                                            <h3>{lecture.order}. {lecture.title}</h3>
                                            <span className={`lecture-status ${lecture.is_published ? 'published' : 'draft'}`}>
                                                {lecture.is_published ? 'منشورة' : 'مسودة'}
                                            </span>
                                            {lecture.is_locked && (
                                                <span className="lecture-lock-status">مقفلة (تتطلب: {lecture.required_quiz_or_exam_details?.title || 'غير محدد'})</span>
                                            )}
                                        </div>
                                        <div className="lecture-actions">
                                            <button onClick={() => handleEditLectureClick(lecture)} className="btn btn-edit">تعديل المحاضرة</button>
                                            <button onClick={() => handleDeleteLecture(lecture.id)} className="btn btn-delete">حذف المحاضرة</button>
                                            <button onClick={() => setExpandedLecture(expandedLecture === lecture.id ? null : lecture.id)} className="btn btn-view-materials">
                                                {expandedLecture === lecture.id ? 'إخفاء المواد' : 'إدارة المواد'}
                                            </button>
                                        </div>

                                        {/* Edit Lecture Form */}
                                        {editingLectureId === lecture.id && (
                                            <form onSubmit={handleUpdateLecture} className="edit-lecture-form">
                                                <h3>تعديل المحاضرة: {editingLectureData.title}</h3>
                                                <div className="form-group">
                                                    <label htmlFor={`edit-title-${lecture.id}`}>العنوان:</label>
                                                    <input type="text" id={`edit-title-${lecture.id}`} name="title" value={editingLectureData.title} onChange={(e) => setEditingLectureData({ ...editingLectureData, title: e.target.value })} required />
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor={`edit-description-${lecture.id}`}>الوصف:</label>
                                                    <textarea id={`edit-description-${lecture.id}`} name="description" value={editingLectureData.description} onChange={(e) => setEditingLectureData({ ...editingLectureData, description: e.target.value })}></textarea>
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor={`edit-order-${lecture.id}`}>الترتيب:</label>
                                                    <input type="number" id={`edit-order-${lecture.id}`} name="order" value={editingLectureData.order} onChange={(e) => setEditingLectureData({ ...editingLectureData, order: e.target.value })} required />
                                                </div>
                                                <div className="form-group checkbox-group">
                                                    <input type="checkbox" id={`edit-published-${lecture.id}`} name="is_published" checked={editingLectureData.is_published} onChange={(e) => setEditingLectureData({ ...editingLectureData, is_published: e.target.checked })} />
                                                    <label htmlFor={`edit-published-${lecture.id}`}>منشورة</label>
                                                </div>
                                                <div className="form-group checkbox-group">
                                                    <input type="checkbox" id={`edit-locked-${lecture.id}`} name="is_locked" checked={editingLectureData.is_locked} onChange={(e) => setEditingLectureData({ ...editingLectureData, is_locked: e.target.checked })} />
                                                    <label htmlFor={`edit-locked-${lecture.id}`}>مقفلة</label>
                                                </div>
                                                {editingLectureData.is_locked && (
                                                    <div className="form-group">
                                                        <label htmlFor={`edit-required-quiz-${lecture.id}`}>الواجب/الامتحان المطلوب لفتح القفل:</label>
                                                        <select id={`edit-required-quiz-${lecture.id}`} name="required_quiz_or_exam" value={editingLectureData.required_quiz_or_exam || ''} onChange={(e) => setEditingLectureData({ ...editingLectureData, required_quiz_or_exam: e.target.value || null })}>
                                                            <option value="">لا يوجد</option>
                                                            {availableQuizzes.map(quiz => (
                                                                <option key={quiz.id} value={quiz.id}>
                                                                    {quiz.title} ({quiz.lecture_title})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                                <button type="submit" className="btn btn-primary" disabled={loading}>حفظ التعديلات</button>
                                                <button type="button" onClick={() => setEditingLectureId(null)} className="btn btn-secondary">إلغاء</button>
                                            </form>
                                        )}

                                        {/* Materials List for Lecture */}
                                        {expandedLecture === lecture.id && (
                                            <div className="materials-list-management">
                                                <h4>مواد المحاضرة: {lecture.title}</h4>
                                                {lecture.materials.length > 0 ? (
                                                    lecture.materials.map(material => (
                                                        <div key={material.id} className="material-management-item">
                                                            <div className="material-summary">
                                                                <span className="material-icon">{getMaterialIcon(material.type)}</span>
                                                                <span>{material.order}. {material.title} ({material.get_type_display})</span>
                                                                {!material.is_published && <span className="material-status draft">مسودة</span>}
                                                            </div>
                                                            <div className="material-actions">
                                                                <button onClick={() => handleEditMaterialClick(material)} className="btn btn-edit">تعديل</button>
                                                                <button onClick={() => handleDeleteMaterial(material.id)} className="btn btn-delete">حذف</button>
                                                            </div>

                                                            {/* Edit Material Form */}
                                                            {editingMaterialId === material.id && (
                                                                <form onSubmit={(e) => handleUpdateMaterial(e, material.id)} className="edit-material-form">
                                                                    <h3>تعديل المادة: {editingMaterialData.title}</h3>
                                                                    <div className="form-group">
                                                                        <label>العنوان:</label>
                                                                        <input type="text" name="title" value={editingMaterialData.title} onChange={handleNewMaterialChange} required />
                                                                    </div>
                                                                    <div className="form-group">
                                                                        <label>النوع:</label>
                                                                        <select name="type" value={editingMaterialData.type} onChange={handleNewMaterialChange} required>
                                                                            <option value="">اختر النوع</option>
                                                                            {academicStructure.materialTypes && Object.keys(academicStructure.materialTypes).map(key => (
                                                                                <option key={key} value={key}>{academicStructure.materialTypes[key].label}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                    {/* Conditional fields based on type */}
                                                                    {(editingMaterialData.type === 'video' || editingMaterialData.type === 'pdf') && (
                                                                        <div className="form-group">
                                                                            <label>الملف (اترك فارغاً لعدم التغيير):</label>
                                                                            <input type="file" name="file" accept={editingMaterialData.type === 'video' ? 'video/*' : '.pdf'} onChange={handleNewMaterialFileChange} />
                                                                            {material.file_url && <p className="form-note">الملف الحالي: <a href={`http://127.0.0.1:8000${material.file_url}`} target="_blank">عرض</a></p>}
                                                                        </div>
                                                                    )}
                                                                    {editingMaterialData.type === 'link' && (
                                                                        <div className="form-group">
                                                                            <label>الرابط:</label>
                                                                            <input type="url" name="url" value={editingMaterialData.url} onChange={handleNewMaterialChange} required />
                                                                        </div>
                                                                    )}
                                                                    {editingMaterialData.type === 'text' && (
                                                                        <div className="form-group">
                                                                            <label>المحتوى النصي:</label>
                                                                            <textarea name="text_content" value={editingMaterialData.text_content} onChange={handleNewMaterialChange} required></textarea>
                                                                        </div>
                                                                    )}
                                                                    {(editingMaterialData.type === 'quiz' || editingMaterialData.type === 'exam') && (
                                                                        <div className="form-group quiz-assignment-details">
                                                                            <label>مدة الاختبار (بالدقائق):</label>
                                                                            <input type="number" name="duration_minutes" value={editingQuizDetails.duration_minutes} onChange={handleNewQuizDetailsChange} />
                                                                            <label>نسبة النجاح (%):</label>
                                                                            <input type="number" name="passing_score_percentage" value={editingQuizDetails.passing_score_percentage} onChange={handleNewQuizDetailsChange} />
                                                                            <Link to={`/teacher/quizzes/${editingMaterialData.quiz_details?.id}/manage-questions`} className="btn btn-secondary mt-3">
                                                                                إدارة الأسئلة
                                                                            </Link>
                                                                        </div>
                                                                    )}
                                                                    <div className="form-group">
                                                                        <label>الترتيب:</label>
                                                                        <input type="number" name="order" value={editingMaterialData.order} onChange={handleNewMaterialChange} />
                                                                    </div>
                                                                    <div className="form-group checkbox-group">
                                                                        <input type="checkbox" name="is_published" checked={editingMaterialData.is_published} onChange={handleNewMaterialChange} />
                                                                        <label>منشورة</label>
                                                                    </div>
                                                                    <button type="submit" className="btn btn-primary" disabled={loading}>حفظ التعديلات</button>
                                                                    <button type="button" onClick={() => setEditingMaterialId(null)} className="btn btn-secondary">إلغاء</button>
                                                                </form>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p>لا توجد مواد تعليمية في هذه المحاضرة.</p>
                                                )}
                                                <button onClick={() => handleAddMaterialClick(lecture.id)} className="btn btn-add-material">إضافة مادة جديدة</button>

                                                {/* Add Material Form */}
                                                {showAddMaterialForm === lecture.id && (
                                                    <form onSubmit={(e) => handleAddMaterialSubmit(e, lecture.id)} className="add-material-form">
                                                        <h3>إضافة مادة جديدة للمحاضرة {lecture.title}</h3>
                                                        <div className="form-group">
                                                            <label>العنوان:</label>
                                                            <input type="text" name="title" value={newMaterialData.title} onChange={handleNewMaterialChange} required />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>النوع:</label>
                                                            <select name="type" value={newMaterialData.type} onChange={handleNewMaterialChange} required>
                                                                <option value="">اختر النوع</option>
                                                                {academicStructure.materialTypes && Object.keys(academicStructure.materialTypes).map(key => (
                                                                    <option key={key} value={key}>{academicStructure.materialTypes[key].label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        {/* Conditional fields based on type */}
                                                        {(newMaterialData.type === 'video' || newMaterialData.type === 'pdf') && (
                                                            <div className="form-group">
                                                                <label>الملف:</label>
                                                                <input type="file" name="file" accept={newMaterialData.type === 'video' ? 'video/*' : '.pdf'} onChange={handleNewMaterialFileChange} required />
                                                            </div>
                                                        )}
                                                        {newMaterialData.type === 'link' && (
                                                            <div className="form-group">
                                                                <label>الرابط:</label>
                                                                <input type="url" name="url" value={newMaterialData.url} onChange={handleNewMaterialChange} required />
                                                            </div>
                                                        )}
                                                        {newMaterialData.type === 'text' && (
                                                            <div className="form-group">
                                                                <label>المحتوى النصي:</label>
                                                                <textarea name="text_content" value={newMaterialData.text_content} onChange={handleNewMaterialChange} required></textarea>
                                                            </div>
                                                        )}
                                                        {(newMaterialData.type === 'quiz' || newMaterialData.type === 'exam') && (
                                                            <div className="form-group quiz-assignment-details">
                                                                <label>مدة الاختبار (بالدقائق):</label>
                                                                <input type="number" name="duration_minutes" value={newQuizDetails.duration_minutes} onChange={handleNewQuizDetailsChange} />
                                                                <label>نسبة النجاح (%):</label>
                                                                <input type="number" name="passing_score_percentage" value={newQuizDetails.passing_score_percentage} onChange={handleNewQuizDetailsChange} />
                                                                <p className="form-note">بعد إضافة المادة، يمكنك إدارة الأسئلة من صفحة إدارة الأسئلة.</p>
                                                            </div>
                                                        )}
                                                        <div className="form-group">
                                                            <label>الترتيب:</label>
                                                            <input type="number" name="order" value={newMaterialData.order} onChange={handleNewMaterialChange} />
                                                        </div>
                                                        <div className="form-group checkbox-group">
                                                            <input type="checkbox" name="is_published" checked={newMaterialData.is_published} onChange={handleNewMaterialChange} />
                                                            <label>منشورة</label>
                                                        </div>
                                                        <button type="submit" className="btn btn-primary" disabled={loading}>إضافة المادة</button>
                                                        <button type="button" onClick={() => setShowAddMaterialForm(null)} className="btn btn-secondary">إلغاء</button>
                                                    </form>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p>لا توجد محاضرات لهذا الكورس بعد. <button onClick={() => setExpandedLecture('new')} className="btn btn-sm">أضف المحاضرة الأولى</button></p>
                            )}
                        </div>

                        {/* Add New Lecture Form */}
                        {expandedLecture === 'new' && (
                            <form onSubmit={handleAddLecture} className="add-lecture-form">
                                <h2>إضافة محاضرة جديدة</h2>
                                <div className="form-group">
                                    <label htmlFor="newLectureTitle">عنوان المحاضرة:</label>
                                    <input type="text" id="newLectureTitle" name="title" value={newLectureTitle} onChange={(e) => setNewLectureTitle(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="newLectureDescription">وصف المحاضرة (اختياري):</label>
                                    <textarea id="newLectureDescription" name="description" value={newLectureDescription} onChange={(e) => setNewLectureDescription(e.target.value)}></textarea>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="newLectureOrder">الترتيب:</label>
                                    <input type="number" id="newLectureOrder" name="order" value={newLectureOrder} onChange={(e) => setNewLectureOrder(e.target.value)} required />
                                </div>
                                <div className="form-group checkbox-group">
                                    <input type="checkbox" id="isLecturePublished" name="is_published" checked={isLecturePublished} onChange={(e) => setIsLecturePublished(e.target.checked)} />
                                    <label htmlFor="isLecturePublished">نشر المحاضرة فوراً؟</label>
                                </div>
                                <div className="form-group checkbox-group">
                                    <input type="checkbox" id="newLectureLocked" name="is_locked" checked={newLectureLocked} onChange={(e) => setNewLectureLocked(e.target.checked)} />
                                    <label htmlFor="newLectureLocked">مقفلة (تتطلب اختبار لإلغاء القفل)</label>
                                </div>
                                {newLectureLocked && (
                                    <div className="form-group">
                                        <label htmlFor="requiredQuizForNewLecture">الواجب/الامتحان المطلوب لفتح القفل:</label>
                                        <select id="requiredQuizForNewLecture" name="required_quiz_or_exam" value={requiredQuizForNewLecture} onChange={(e) => setRequiredQuizForNewLecture(e.target.value)} required>
                                            <option value="">اختر واجب/امتحان</option>
                                            {availableQuizzes.map(quiz => (
                                                <option key={quiz.id} value={quiz.id}>
                                                    {quiz.title} ({quiz.lecture_title})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <button type="submit" disabled={loading} className="btn btn-primary submit-btn">
                                    {loading ? 'جاري الإضافة...' : 'إضافة المحاضرة'}
                                </button>
                                <button type="button" onClick={() => setExpandedLecture(null)} className="btn btn-secondary">إلغاء</button>
                            </form>
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

export default TeacherManageCourseContentPage;
