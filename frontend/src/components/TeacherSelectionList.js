import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, ToastContext } from '../App';
import DefaultUserImage from '../assets/images/default_user.png';
import academicStructure from '../constants/academicStructure';

import './TeacherProfilePage.css'; // Reusing some styles for teacher cards
import './Dashboard.css'; // For general grid/card layout

function TeacherSelectionList() {
    const { user } = useContext(AuthContext);
    const showGlobalToast = useContext(ToastContext);

    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [filterSubject, setFilterSubject] = useState('');
    const [filterGovernorate, setFilterGovernorate] = useState('');

    const userToken = user?.token;

    useEffect(() => {
        const fetchTeachers = async () => {
            setLoading(true);
            setError(null);
            try {
                const config = userToken ? { headers: { Authorization: `Token ${userToken}` } } : {};
                const params = { is_active: true }; // Only fetch active teachers
                if (filterSubject) {
                    params.specialized_subject = filterSubject;
                }
                if (filterGovernorate) {
                    params.governorate = filterGovernorate;
                }

                const response = await axios.get('http://127.0.0.1:8000/api/users/teachers/', { ...config, params });
                setTeachers(Array.isArray(response.data.results) ? response.data.results : response.data);
            } catch (err) {
                console.error("Error fetching teachers:", err);
                setError('فشل تحميل قائمة المدرسين.');
                showGlobalToast('فشل تحميل قائمة المدرسين.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchTeachers();
    }, [filterSubject, filterGovernorate, userToken, showGlobalToast]);

    const handleSubjectChange = (e) => {
        setFilterSubject(e.target.value);
    };

    const handleGovernorateChange = (e) => {
        setFilterGovernorate(e.target.value);
    };

    const handleClearFilters = () => {
        setFilterSubject('');
        setFilterGovernorate('');
    };

    const buildFullUrl = (relativePath) => {
        if (!relativePath) return '';
        if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
            return relativePath;
        }
        return `http://127.0.0.1:8000${relativePath}`;
    };

    return (
        <div className="teacher-selection-list-page">
            <main className="main-content">
                <section className="teacher-list-section">
                    <div className="container dashboard-container">
                        <h1>المدرسون المتاحون</h1>

                        <div className="teachers-filter">
                            <select value={filterSubject} onChange={handleSubjectChange} className="filter-select">
                                <option value="">جميع المواد</option>
                                {academicStructure.subjects && Object.keys(academicStructure.subjects).map(key => (
                                    <option key={key} value={key}>{academicStructure.subjects[key].label}</option>
                                ))}
                            </select>
                            <select value={filterGovernorate} onChange={handleGovernorateChange} className="filter-select">
                                <option value="">جميع المحافظات</option>
                                {academicStructure.governorates && Object.keys(academicStructure.governorates).map(key => (
                                    <option key={key} value={key}>{academicStructure.governorates[key].label}</option>
                                ))}
                            </select>
                            <button onClick={handleClearFilters} className="btn btn-secondary clear-filter-btn">مسح الفلاتر</button>
                        </div>

                        {loading ? (
                            <p>جاري تحميل المدرسين...</p>
                        ) : error ? (
                            <p className="error-message-box">{error}</p>
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
                            <p>لا يوجد مدرسون متاحون حالياً بالمعايير المختارة.</p>
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

export default TeacherSelectionList;
