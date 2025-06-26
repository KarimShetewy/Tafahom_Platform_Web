from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls')),
    path('api/auth/', include('djoser.urls')),
    path('api/auth/', include('djoser.urls.authtoken')),
    path('api/users/', include('users.urls')),
    path('api/courses/', include('courses.urls')),
    # ... تأكد أن جميع مسارات الـ API الخاصة بك تأتي هنا قبل الجزء التالي لخدمة الميديا

]

# **هذا الجزء يجب أن يأتي بعد جميع مسارات الـ API (path('api/...'))**
# **وقبل أي مسارات عامة أخرى (مثل path('', ...))**
# لخدمة ملفات الميديا (الصور المرفوعة) في وضع التطوير
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# **ثم تأتي مسارات React SPA العامة في النهاية لكي تلتقط أي مسار لم يتم معالجته بواسطة Django**
urlpatterns += [
    path('', TemplateView.as_view(template_name='index.html')),
    path('<path:resource>', TemplateView.as_view(template_name='index.html')),
]
