from django.urls import path
from . import views as users_views # استيراد views من تطبيق users
from courses import views as courses_views # استيراد views من تطبيق courses
from django.views.decorators.csrf import csrf_exempt 


urlpatterns = [
    # مسارات لتقديم طلبات إنشاء الحساب لأنواع المستخدمين المختلفة
    path('register/student/', csrf_exempt(users_views.StudentRegistrationView.as_view()), name='student_register'), 
    path('register/teacher/', csrf_exempt(users_views.TeacherRegistrationView.as_view()), name='teacher_register'), 
    path('register/team/', csrf_exempt(users_views.TeamRegistrationView.as_view()), name='team_register'), 

    # مسار لجلب وتعديل بروفايل المستخدم الحالي (المسجل دخوله)
    path('profile/', users_views.UserProfileView.as_view(), name='user_profile'), 
    
    # مسار لجلب تفاصيل معلم معين بواسطة ID
    path('teachers/<int:pk>/', users_views.CustomUserRetrieveAPIView.as_view(), name='teacher_detail'),
    
    # مسار لجلب قائمة بجميع المدرسين
    path('teachers/', users_views.TeacherListAPIView.as_view(), name='teacher_list'), 

    # مسار لصفحة المحفظة / شحن الرصيد
    path('charge-wallet/', users_views.ChargeWalletView.as_view(), name='charge_wallet'),
    
    # مسار لجلب اشتراكات الطالب الحالي (موجود في courses.views)
    path('my-enrollments/', courses_views.StudentEnrollmentsListAPIView.as_view(), name='student-enrollments-list'), 
]
