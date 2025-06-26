import React, { useContext } from 'react';
import { AuthContext } from '../App';
import './TeamDashboard.css';

function TeamDashboard() {
    const { user } = useContext(AuthContext);

    if (!user) {
        return (
            <div className="team-dashboard">
                <main className="main-content">
                    <div className="container">
                        <p className="error-message-box">الرجاء تسجيل الدخول لعرض لوحة التحكم.</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="team-dashboard">
            <main className="main-content">
                <div className="container dashboard-container">
                    <h1>لوحة تحكم فريق العمل</h1>
                    <div className="dashboard-summary">
                        <div className="summary-card">
                            <h3>أهلاً بك، {user.firstName}</h3>
                            <p>أنت مسجل كـ {user.userType === 'team_member' ? 'عضو فريق عمل' : 'مسؤول'}.</p>
                        </div>
                        {/* Add more team-specific summary cards */}
                        <div className="summary-card">
                            <h3>المهام اليومية</h3>
                            <p>لا توجد مهام معلقة لهذا اليوم.</p>
                        </div>
                    </div>

                    <section className="dashboard-actions">
                        <h2>الإجراءات السريعة</h2>
                        <div className="action-buttons-grid">
                            <button className="btn btn-primary action-btn">مراجعة طلبات التسجيل</button>
                            <button className="btn btn-secondary action-btn">إدارة المحتوى</button>
                            <button className="btn btn-primary action-btn">إرسال إشعارات</button>
                            <button className="btn btn-secondary action-btn">عرض تقارير الأداء</button>
                        </div>
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

export default TeamDashboard;
