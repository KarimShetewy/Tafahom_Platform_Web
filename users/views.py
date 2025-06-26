# users/views.py

from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404
from django.db import transaction 
import json
from decimal import Decimal 
from django.views.decorators.csrf import csrf_exempt 
from django.utils.decorators import method_decorator 


# Correct imports for models from their respective apps
from courses.models import Course, Lecture, Material, QuizOrAssignment, Question, Choice, Enrollment 
from users.models import CustomUser, AccountRequest 


from courses.serializers import ( 
    CourseSerializer, LectureSerializer, MaterialSerializer,
    QuizOrAssignmentSerializer, QuestionSerializer, ChoiceSerializer,
    EnrollmentSerializer
)
# **التعديل هنا: إزالة TeacherProfileSerializer من هذا الاستيراد**
from users.serializers import CustomUserSerializer, AccountRequestSerializer 
from users.serializers import TeacherProfileSerializer # **هذا السطر سيتم إزالته أيضاً أو التأكد من أنه ليس مكرراً**
from rest_framework import serializers 


# Views لتقديم طلبات إنشاء الحساب لأنواع المستخدمين المختلفة (معفاة من CSRF)
# تم نقل @method_decorator(csrf_exempt, name='dispatch') إلى users/urls.py لتبسيط views.py
# إذا كنت تستخدم @method_decorator هنا، يجب عليك إزالته من users/urls.py
class StudentRegistrationView(generics.CreateAPIView):
    queryset = AccountRequest.objects.all()
    serializer_class = AccountRequestSerializer
    permission_classes = [permissions.AllowAny] 
    http_method_names = ['post'] 

    def perform_create(self, serializer):
        serializer.save(user_type='student')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True) 
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {"message": "تم إرسال طلب إنشاء حساب طالب بنجاح. سيتم مراجعته قريباً."},
            status=status.HTTP_201_CREATED,
            headers=headers
        )

class TeacherRegistrationView(generics.CreateAPIView):
    queryset = AccountRequest.objects.all()
    serializer_class = AccountRequestSerializer
    permission_classes = [permissions.AllowAny] 
    http_method_names = ['post'] 

    def perform_create(self, serializer):
        serializer.save(user_type='teacher')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {"message": "تم إرسال طلب إنشاء حساب أستاذ بنجاح. سيتم مراجعته قريباً."},
            status=status.HTTP_201_CREATED,
            headers=headers
        )

class TeamRegistrationView(generics.CreateAPIView):
    queryset = AccountRequest.objects.all()
    serializer_class = AccountRequestSerializer
    permission_classes = [permissions.AllowAny] 
    http_method_names = ['post'] 

    def perform_create(self, serializer):
        serializer.save(user_type='team_member')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {"message": "تم إرسال طلب إنشاء حساب عضو فريق بنجاح. سيتم مراجعته قريباً."},
            status=status.HTTP_201_CREATED,
            headers=headers
        )


# View لجلب بيانات بروفايل المستخدم الحالي (المسجل دخوله)
class UserProfileView(generics.RetrieveAPIView):
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated] 

    def get_object(self):
        return self.request.user

# View لجلب بيانات مستخدم واحد بواسطة ID (خاصة لملف تعريف المدرس لصفحته العامة)
class CustomUserRetrieveAPIView(generics.RetrieveAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = TeacherProfileSerializer
    permission_classes = [permissions.AllowAny] 
    lookup_field = 'pk'

    def get_queryset(self):
        return CustomUser.objects.filter(user_type='teacher')

# View لجلب قائمة بجميع المدرسين
class TeacherListAPIView(generics.ListAPIView):
    queryset = CustomUser.objects.filter(user_type='teacher', is_active=True)
    serializer_class = TeacherProfileSerializer 
    permission_classes = [permissions.AllowAny] 

# View لشحن رصيد المحفظة
class ChargeWalletView(generics.CreateAPIView): 
    serializer_class = serializers.Serializer 
    permission_classes = [permissions.IsAuthenticated] 
    http_method_names = ['post']

    class InputSerializer(serializers.Serializer):
        amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'))

    def create(self, request, *args, **kwargs):
        user = request.user
        if user.user_type != 'student':
            raise PermissionDenied("فقط الطلاب يمكنهم شحن المحفظة.")

        input_serializer = self.InputSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        amount = input_serializer.validated_data['amount']
        
        with transaction.atomic(): 
            user.balance += amount
            user.save()

        return Response(
            {"message": "تم شحن المحفظة بنجاح!", "new_balance": user.balance},
            status=status.HTTP_200_OK
        )

# View لجلب اشتراكات الطالب الحالي
class StudentEnrollmentsListAPIView(generics.ListAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.user_type != 'student':
            raise PermissionDenied("فقط الطلاب يمكنهم عرض اشتراكاتهم.")
        return Enrollment.objects.filter(student=user).order_by('-enrollment_date')

# View لإنشاء اشتراك في كورس (EnrollmentCreateAPIView) مع CSRF Exempt مباشر
@method_decorator(csrf_exempt, name='dispatch') # تطبيق csrf_exempt هنا مباشرة
class EnrollmentCreateAPIView(generics.CreateAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated] 
    http_method_names = ['post']

    def perform_create(self, serializer):
        user = self.request.user
        course_id = self.request.data.get('course') 

        if not user.is_authenticated or user.user_type != 'student':
            raise PermissionDenied("فقط الطلاب يمكنهم الاشتراك في الكورسات.")

        course = get_object_or_404(Course, id=course_id)

        if Enrollment.objects.filter(student=user, course=course, is_active=True).exists():
            raise ValidationError({"detail": "أنت مشترك بالفعل في هذا الكورس."})

        if user.balance < course.price:
            raise ValidationError({"detail": f"رصيدك الحالي ({user.balance} جنيه) غير كافٍ للاشتراك في هذا الكورس ({course.price} جنيه)."})

        with transaction.atomic():
            user.balance -= course.price
            user.save()

            serializer.save(student=user, course=course)
        
        return Response(
            {"message": "تم الاشتراك في الكورس بنجاح!", "new_balance": user.balance},
            status=status.HTTP_201_CREATED
        )
