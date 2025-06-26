from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, AccountRequest

# Register your models here.

class CustomUserAdmin(UserAdmin):
    # إضافة الحقول المخصصة لـ CustomUser في لوحة الإدارة
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('user_type', 'image', 'gender', 'governorate', 'phone_number', 'balance',
                           'specialized_subject', 'qualifications', 'experience', 'what_will_you_add',
                           'instagram_link', 'facebook_link', 'website_link',
                           'academic_level', 'academic_track', 'second_name', 'third_name',
                           'parent_father_phone_number', 'parent_mother_phone_number',
                           'school_name', 'parent_profession', 'teacher_name_for_student',
                           'job_position', 'expected_salary', 'address', 'previous_work_experience',
                           'personal_id_card', 'cv_file')}),
    )
    # إضافة الحقول المخصصة لقائمة العرض في لوحة الإدارة
    list_display = ('email', 'first_name', 'last_name', 'user_type', 'is_staff', 'is_active', 'balance')
    # إضافة فلاتر البحث
    search_fields = ('email', 'first_name', 'last_name', 'phone_number')
    # إضافة فلاتر الاختيار
    list_filter = ('user_type', 'gender', 'governorate', 'is_staff', 'is_active')

admin.site.register(CustomUser, CustomUserAdmin)


# Custom Admin for AccountRequest
class AccountRequestAdmin(admin.ModelAdmin):
    list_display = ('email', 'user_type', 'first_name', 'last_name', 'status', 'request_date')
    list_filter = ('user_type', 'status')
    search_fields = ('email', 'first_name', 'last_name', 'phone_number')
    actions = ['approve_requests', 'reject_requests'] # إضافة إجراءات مخصصة

    def approve_requests(self, request, queryset):
        for req in queryset:
            if req.status == 'pending':
                try:
                    # إنشاء مستخدم CustomUser من بيانات الطلب
                    user = CustomUser.objects.create_user(
                        email=req.email,
                        password=req.password, # يجب أن تكون كلمة المرور مشفرة عند الإنشاء الفعلي
                        first_name=req.first_name,
                        last_name=req.last_name,
                        user_type=req.user_type,
                        gender=req.gender,
                        governorate=req.governorate,
                        phone_number=req.phone_number,
                        # حقول خاصة بالطلاب
                        academic_level=req.academic_level,
                        academic_track=req.academic_track,
                        second_name=req.second_name,
                        third_name=req.third_name,
                        parent_father_phone_number=req.parent_father_phone_number,
                        parent_mother_phone_number=req.parent_mother_phone_number,
                        school_name=req.school_name,
                        parent_profession=req.parent_profession,
                        teacher_name_for_student=req.teacher_name_for_student,
                        # حقول خاصة بالمعلمين
                        specialized_subject=req.category_type, # هنا نربط category_type بـ specialized_subject
                        qualifications=req.qualifications,
                        experience=req.experience,
                        what_will_you_add=req.what_will_you_add,
                        # حقول خاصة بفريق العمل
                        job_position=req.job_position,
                        expected_salary=req.expected_salary,
                        address=req.address,
                        previous_work_experience=req.previous_work_experience,
                        instagram_link=req.instagram_link,
                        facebook_link=req.facebook_link,
                        website_link=req.website_link,
                        # حقول الملفات يجب أن تتم معالجتها يدوياً إذا كانت AccountRequest لا تخزنها كـ FileField
                        # أو نقلها من AccountRequest إذا كانت تخزنها
                    )
                    user.is_active = True # تفعيل الحساب
                    user.save()
                    req.status = 'approved'
                    req.save()
                    self.message_user(request, f"تم قبول طلب {req.email} بنجاح وتم إنشاء الحساب.")
                except Exception as e:
                    self.message_user(request, f"فشل قبول طلب {req.email}: {str(e)}", level='error')
    approve_requests.short_description = "قبول الطلبات المختارة وإنشاء الحسابات" # وصف الإجراء في لوحة الإدارة

    def reject_requests(self, request, queryset):
        for req in queryset:
            if req.status == 'pending':
                req.status = 'rejected'
                # يمكنك إضافة حقل لسبب الرفض إذا أردت
                req.save()
                self.message_user(request, f"تم رفض طلب {req.email} بنجاح.")
    reject_requests.short_description = "رفض الطلبات المختارة"

admin.site.register(AccountRequest, AccountRequestAdmin)
