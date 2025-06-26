# users/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager, PermissionsMixin
from django.utils import timezone

# استيراد الثوابت من tafahom_project.constants
# تأكد من أنك قمت بإنشاء ملف constants.py في tafahom_project/
# أو قم بإزالة هذا الاستيراد إذا لم تكن تستخدمه حالياً
from tafahom_project.constants import (
    JOB_POSITION_CHOICES, GENDER_CHOICES, GOVERNORATE_CHOICES, ACADEMIC_LEVEL_CHOICES,
    ACADEMIC_TRACK_CHOICES, SUBJECT_CHOICES, PARENT_PROFESSION_CHOICES
)


class CustomUserManager(BaseUserManager): 
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password) 
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('user_type', 'admin') 
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


# Custom User Model
class CustomUser(AbstractUser): 
    email = models.EmailField(unique=True, verbose_name='البريد الإلكتروني') 
    
    username = None 

    USERNAME_FIELD = 'email' 
    REQUIRED_FIELDS = ['first_name', 'last_name', 'user_type'] 

    USER_TYPE_CHOICES = (
        ('student', 'طالب'),
        ('teacher', 'أستاذ'),
        ('team_member', 'عضو فريق عمل'),
        ('admin', 'مسؤول'),
    )
    user_type = models.CharField(
        max_length=20,
        choices=USER_TYPE_CHOICES,
        default='student',
        verbose_name='نوع المستخدم'
    )
    
    # **NEW:** حقل الرصيد للمحفظة
    balance = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0.00, 
        verbose_name='الرصيد المالي'
    )

    # حقول إضافية عامة لجميع المستخدمين أو اختيارية
    image = models.ImageField(upload_to='profile_pics/', blank=True, null=True, verbose_name='الصورة الشخصية') 
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True, verbose_name='الجنس')
    governorate = models.CharField(max_length=50, choices=GOVERNORATE_CHOICES, blank=True, null=True, verbose_name='المحافظة')
    phone_number = models.CharField(max_length=15, blank=True, null=True, verbose_name='رقم الهاتف')
    
    # NEW: حقول خاصة بالمعلمين (لكن موجودة في CustomUser واختيارية)
    specialized_subject = models.CharField(max_length=100, choices=SUBJECT_CHOICES, blank=True, null=True, verbose_name='المادة المتخصصة')
    qualifications = models.TextField(blank=True, null=True, verbose_name='المؤهلات')
    experience = models.TextField(blank=True, null=True, verbose_name='الخبرة')
    what_will_you_add = models.TextField(blank=True, null=True, verbose_name='ما الذي سيضيفه للمنصة؟')
    instagram_link = models.URLField(max_length=200, blank=True, null=True, verbose_name='رابط انستجرام')
    facebook_link = models.URLField(max_length=200, blank=True, null=True, verbose_name='رابط فيسبوك')
    website_link = models.URLField(max_length=200, blank=True, null=True, verbose_name='رابط الموقع الإلكتروني')

    # NEW: حقول خاصة بالطلاب (لكن موجودة في CustomUser واختيارية)
    academic_level = models.CharField(max_length=50, choices=ACADEMIC_LEVEL_CHOICES, blank=True, null=True, verbose_name='الصف الدراسي') 
    academic_track = models.CharField(max_length=50, choices=ACADEMIC_TRACK_CHOICES, blank=True, null=True, verbose_name='المسار الدراسي') 
    second_name = models.CharField(max_length=100, blank=True, null=True, verbose_name='الاسم الثاني (الأب)')
    third_name = models.CharField(max_length=100, blank=True, null=True, verbose_name='الاسم الثالث (الجد)')
    parent_father_phone_number = models.CharField(max_length=15, blank=True, null=True, verbose_name='رقم هاتف الأب')
    parent_mother_phone_number = models.CharField(max_length=15, blank=True, null=True, verbose_name='رقم هاتف الأم')
    school_name = models.CharField(max_length=255, blank=True, null=True, verbose_name='اسم المدرسة')
    parent_profession = models.CharField(max_length=50, choices=PARENT_PROFESSION_CHOICES, blank=True, null=True, verbose_name='مهنة ولي الأمر') 
    teacher_name_for_student = models.CharField(max_length=255, blank=True, null=True, verbose_name='اسم الأستاذ للطالب')
    personal_id_card = models.FileField(upload_to='profile_files/personal_ids/', blank=True, null=True, verbose_name='صورة البطاقة الشخصية/شهادة الميلاد')
    cv_file = models.FileField(upload_to='profile_files/cvs/', blank=True, null=True, verbose_name='ملف السيرة الذاتية (CV)')


    # NEW: حقول خاصة بفريق العمل (لكن موجودة في CustomUser واختيارية)
    job_position = models.CharField(max_length=50, choices=JOB_POSITION_CHOICES, blank=True, null=True, verbose_name='الوظيفة المطلوبة') 
    expected_salary = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name='الراتب المتوقع')
    address = models.TextField(blank=True, null=True, verbose_name='العنوان بالتفصيل')
    previous_work_experience = models.TextField(blank=True, null=True, verbose_name='خبرة العمل السابقة')


    objects = CustomUserManager() 

    class Meta:
        verbose_name = 'مستخدم'
        verbose_name_plural = 'مستخدمين'

    def __str__(self):
        return self.email
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def get_short_name(self):
        return self.first_name

# موديل لطلبات إنشاء الحساب (Account Requests)
class AccountRequest(models.Model):
    REQUEST_STATUS_CHOICES = (
        ('pending', 'قيد المراجعة'),
        ('approved', 'مقبول'),
        ('rejected', 'مرفوض'),
    )
    REQUEST_USER_TYPE_CHOICES = (
        ('student', 'طالب'),
        ('teacher', 'أستاذ'),
        ('team_member', 'عضو فريق عمل'),
    )

    email = models.EmailField(unique=True, verbose_name='البريد الإلكتروني')
    password = models.CharField(max_length=128, verbose_name='كلمة المرور (خام)') 
    user_type = models.CharField(
        max_length=20,
        choices=REQUEST_USER_TYPE_CHOICES,
        verbose_name='نوع الحساب المطلوب'
    )
    first_name = models.CharField(max_length=100, verbose_name='الاسم الأول')
    last_name = models.CharField(max_length=100, verbose_name='الاسم الأخير')
    phone_number = models.CharField(max_length=15, blank=True, null=True, verbose_name='رقم الهاتف')
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True, verbose_name='الجنس')
    governorate = models.CharField(max_length=50, choices=GOVERNORATE_CHOICES, blank=True, null=True, verbose_name='المحافظة')

    # Student-specific fields
    second_name = models.CharField(max_length=100, blank=True, null=True, verbose_name='الاسم الثاني (الأب)')
    third_name = models.CharField(max_length=100, blank=True, null=True, verbose_name='الاسم الثالث (الجد)')
    parent_father_phone_number = models.CharField(max_length=15, blank=True, null=True, verbose_name='رقم هاتف الأب')
    parent_mother_phone_number = models.CharField(max_length=15, blank=True, null=True, verbose_name='رقم هاتف الأم')
    school_name = models.CharField(max_length=255, blank=True, null=True, verbose_name='اسم المدرسة')
    parent_profession = models.CharField(max_length=50, choices=PARENT_PROFESSION_CHOICES, blank=True, null=True, verbose_name='مهنة ولي الأمر') 
    teacher_name_for_student = models.CharField(max_length=255, blank=True, null=True, verbose_name='اسم الأستاذ للطالب')
    academic_level = models.CharField(max_length=50, choices=ACADEMIC_LEVEL_CHOICES, blank=True, null=True, verbose_name='الصف الدراسي') 
    academic_track = models.CharField(max_length=50, choices=ACADEMIC_TRACK_CHOICES, blank=True, null=True, verbose_name='المسار الدراسي') 

    # Teacher-specific fields
    qualifications = models.TextField(blank=True, null=True, verbose_name='المؤهلات (للأستاذ)')
    experience = models.TextField(blank=True, null=True, verbose_name='الخبرة (للأستاذ)')
    category_type = models.CharField(max_length=50, choices=SUBJECT_CHOICES, blank=True, null=True, verbose_name='الفئة المطلوبة (للأستاذ)') 
    what_will_you_add = models.TextField(blank=True, null=True, verbose_name='ما الذي ستضيفه للمنصة؟')

    # Team Member-specific fields
    job_position = models.CharField(max_length=50, choices=JOB_POSITION_CHOICES, blank=True, null=True, verbose_name='الوظيفة المطلوبة (لفريق العمل)') 
    expected_salary = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name='الراتب المتوقع')
    address = models.TextField(blank=True, null=True, verbose_name='العنوان بالتفصيل')
    previous_work_experience = models.TextField(blank=True, null=True, verbose_name='خبرة العمل السابقة (لفريق العمل)')
    instagram_link = models.URLField(max_length=200, blank=True, null=True, verbose_name='رابط انستجرام (اختياري)')
    facebook_link = models.URLField(max_length=200, blank=True, null=True, verbose_name='رابط فيسبوك (اختياري)')
    website_link = models.URLField(max_length=200, blank=True, null=True, verbose_name='رابط الموقع الإلكتروني (اختياري)')

    # تم نقل حقول الملفات إلى CustomUser
    # personal_id_card = models.FileField(...)
    # cv_file = models.FileField(...)

    status = models.CharField(
        max_length=10,
        choices=REQUEST_STATUS_CHOICES,
        default='pending',
        verbose_name='حالة الطلب'
    )
    rejection_reason = models.TextField(blank=True, null=True, verbose_name='سبب الرفض (إن وجد)')
    request_date = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الطلب')

    def __str__(self):
        return f"طلب {self.get_user_type_display()} من {self.first_name} {self.last_name} ({self.status})"

    class Meta:
        verbose_name = 'طلب إنشاء حساب'
        verbose_name_plural = 'طلبات إنشاء الحساب'
