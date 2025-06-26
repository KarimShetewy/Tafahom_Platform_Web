from django.urls import path
from . import views 
from django.views.decorators.csrf import csrf_exempt # مهم: استيراد csrf_exempt هنا


urlpatterns = [
    # **REMOVED: مسار لجلب جميع الكورسات أو تصفيتها (كان يسبب تضاربًا)**
    # path('', views.CourseListCreateAPIView.as_view(), name='course-list-create'),
    # هذا المسار يجب أن يتم التعامل معه من خلال tafahom_project/urls.py
    # أو أن يكون له مسار صريح مثل 'list/'

    # مسارات خاصة بالكورسات التي يملكها المعلم الحالي
    path('my-courses/', views.TeacherListAPIView.as_view(), name='my-courses-list'), # تم تصحيح اسم الـ View سابقا

    # مسار لجلب وتعديل وحذف كورس معين بواسطة ID
    path('<int:pk>/', views.CourseRetrieveUpdateDestroyAPIView.as_view(), name='course-detail-update-delete'),
    
    # مسار لجلب وإنشاء المحاضرات لكورس معين
    path('<int:course_id>/lectures/', views.LectureListCreateAPIView.as_view(), name='lecture-list-create'),
    
    # مسار لجلب وتعديل وحذف محاضرة معينة بواسطة ID المحاضرة
    path('lectures/<int:pk>/', views.LectureRetrieveUpdateDestroyAPIView.as_view(), name='lecture-detail-update-delete'),
    
    # مسار لجلب وإنشاء المواد التعليمية لمحاضرة معينة
    path('lectures/<int:lecture_id>/materials/', views.MaterialListCreateAPIView.as_view(), name='material-list-create'),
    
    # مسار لجلب وتعديل وحذف مادة تعليمية معينة بواسطة ID المادة
    path('materials/<int:pk>/', views.MaterialRetrieveUpdateDestroyAPIView.as_view(), name='material-detail-update-delete'),
    
    # مسار لإدارة الواجبات/الامتحانات (للتحديث والحذف)
    # ملاحظة: الإنشاء يتم ضمن MaterialListCreateAPIView
    path('quizzes/<int:pk>/', views.QuizOrAssignmentRetrieveUpdateDestroyAPIView.as_view(), name='quiz-detail-update-delete'),
    
    # مسارات لإدارة الأسئلة والخيارات داخل الواجبات/الامتحانات
    path('quizzes/<int:quiz_id>/questions/', views.QuestionListCreateAPIView.as_view(), name='question-list-create'),
    path('questions/<int:pk>/', views.QuestionRetrieveUpdateDestroyAPIView.as_view(), name='question-detail-update-delete'),
    
    path('questions/<int:question_id>/choices/', views.ChoiceListCreateAPIAPIView.as_view(), name='choice-list-create'),
    path('choices/<int:pk>/', views.ChoiceRetrieveUpdateDestroyAPIView.as_view(), name='choice-detail-update-delete'),

    # مسارات الاشتراك في الكورسات (مع csrf_exempt)
    path('enroll/', csrf_exempt(views.EnrollmentCreateAPIView.as_view()), name='enrollment-create'), 
    path('my-enrollments/', views.StudentEnrollmentsListAPIView.as_view(), name='student-enrollments-list'), 
]
