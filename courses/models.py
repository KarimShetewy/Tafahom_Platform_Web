# courses/models.py

from django.db import models
# استيراد CustomUser من تطبيق users (المسار الصحيح)
from users.models import CustomUser 
# استيراد الثوابت من tafahom_project.constants
# تأكد من أنك قمت بإنشاء ملف constants.py في tafahom_project/
# أو قم بإزالة هذا الاستيراد إذا لم تكن تستخدمه حالياً
from tafahom_project.constants import ACADEMIC_LEVEL_CHOICES, SUBJECT_CHOICES, COURSE_TYPE_CHOICES, MATERIAL_TYPE_CHOICES 

# موديل الكورس
class Course(models.Model):
    teacher = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='courses', limit_choices_to={'user_type': 'teacher'})
    title = models.CharField(max_length=255, verbose_name='عنوان الكورس')
    description = models.TextField(verbose_name='وصف الكورس')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='سعر الكورس')
    image = models.ImageField(upload_to='course_images/', blank=True, null=True, verbose_name='صورة الكورس')
    academic_level = models.CharField(max_length=50, choices=ACADEMIC_LEVEL_CHOICES, verbose_name='الصف الدراسي')
    subject = models.CharField(max_length=50, choices=SUBJECT_CHOICES, verbose_name='المادة') 
    
    course_type = models.CharField(max_length=20, choices=COURSE_TYPE_CHOICES, default='regular', verbose_name='نوع الكورس')
    is_published = models.BooleanField(default=False, verbose_name='منشور')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='آخر تحديث')

    class Meta:
        verbose_name = 'كورس'
        verbose_name_plural = 'كورسات'
        # قد لا يكون هذا UniqueTogether مطلوباً إذا كان الأستاذ يمكنه إنشاء كورسات متعددة بنفس المادة والصف
        # unique_together = ('teacher', 'academic_level', 'subject') 

    def __str__(self):
        return self.title

# موديل المحاضرة
class Lecture(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lectures', verbose_name='الكورس')
    title = models.CharField(max_length=255, verbose_name='عنوان المحاضرة')
    description = models.TextField(blank=True, null=True, verbose_name='وصف المحاضرة')
    order = models.PositiveIntegerField(verbose_name='الترتيب') 
    is_published = models.BooleanField(default=False, verbose_name='منشورة')
    
    # حقول لربط المحاضرة بالواجبات/الامتحانات المطلوبة لإلغاء القفل
    is_locked = models.BooleanField(default=False, verbose_name='مقفلة')
    required_quiz_or_exam = models.ForeignKey(
        'QuizOrAssignment', 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True, 
        related_name='unlocks_lectures',
        verbose_name='الواجب/الامتحان المطلوب لفتح القفل'
    )

    class Meta:
        verbose_name = 'محاضرة'
        verbose_name_plural = 'محاضرات'
        unique_together = ('course', 'order') 
        ordering = ['order'] 

    def __str__(self):
        return f"{self.course.title} - المحاضرة {self.order}: {self.title}"

# موديل المواد التعليمية
class Material(models.Model):
    lecture = models.ForeignKey(Lecture, on_delete=models.CASCADE, related_name='materials', verbose_name='المحاضرة')
    title = models.CharField(max_length=255, verbose_name='عنوان المادة')
    type = models.CharField(max_length=20, choices=MATERIAL_TYPE_CHOICES, verbose_name='نوع المادة')
    
    # حقول اختيارية بناءً على النوع
    file = models.FileField(upload_to='materials/', blank=True, null=True, verbose_name='ملف') 
    url = models.URLField(max_length=200, blank=True, null=True, verbose_name='رابط خارجي') 
    text_content = models.TextField(blank=True, null=True, verbose_name='محتوى نصي') 
    
    order = models.PositiveIntegerField(default=0, verbose_name='الترتيب') 
    is_published = models.BooleanField(default=False, verbose_name='منشورة')

    class Meta:
        verbose_name = 'مادة تعليمية'
        verbose_name_plural = 'مواد تعليمية'
        ordering = ['order'] 

    def __str__(self):
        return f"{self.lecture.title} - {self.title} ({self.get_type_display()})"

# موديل للواجبات أو الامتحانات
class QuizOrAssignment(models.Model):
    material = models.OneToOneField(Material, on_delete=models.CASCADE, related_name='quiz_details', verbose_name='المادة المرتبطة')
    duration_minutes = models.PositiveIntegerField(blank=True, null=True, verbose_name='مدة الاختبار (بالدقائق)') 
    passing_score_percentage = models.PositiveIntegerField(blank=True, null=True, verbose_name='نسبة النجاح المطلوبة (%)') 

    class Meta:
        verbose_name = 'واجب/امتحان'
        verbose_name_plural = 'واجبات/امتحانات'

    def __str__(self):
        return f"اختبار لـ {self.material.title}"

# موديل السؤال في الواجب/الامتحان
class Question(models.Model):
    quiz_or_assignment = models.ForeignKey(QuizOrAssignment, on_delete=models.CASCADE, related_name='questions', verbose_name='الواجب/الامتحان')
    question_text = models.TextField(verbose_name='نص السؤال')
    points = models.PositiveIntegerField(default=1, verbose_name='النقاط')

    class Meta:
        verbose_name = 'سؤال'
        verbose_name_plural = 'أسئلة'

    def __str__(self):
        return self.question_text[:50] 

# موديل الخيارات للسؤال
class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices', verbose_name='السؤال')
    choice_text = models.CharField(max_length=255, verbose_name='نص الخيار')
    is_correct = models.BooleanField(default=False, verbose_name='إجابة صحيحة')

    class Meta:
        verbose_name = 'خيار'
        verbose_name_plural = 'خيارات'

    def __str__(self):
        return self.choice_text[:50]

# NEW: موديل لتقديمات الواجبات/الامتحانات من قبل الطلاب
class Submission(models.Model):
    quiz_or_assignment = models.ForeignKey(QuizOrAssignment, on_delete=models.CASCADE, related_name='submissions', verbose_name='الواجب/الامتحان')
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='submissions', limit_choices_to={'user_type': 'student'}, verbose_name='الطالب')
    submitted_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ التسليم')
    score = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, verbose_name='الدرجة')
    is_graded = models.BooleanField(default=False, verbose_name='تم التصحيح')
    passed = models.BooleanField(default=False, verbose_name='اجتاز') # هل اجتاز الاختبار بناءً على نسبة النجاح

    class Meta:
        verbose_name = 'تقديم واجب/امتحان'
        verbose_name_plural = 'تقديمات الواجبات/الامتحانات'
        unique_together = ('quiz_or_assignment', 'student') # الطالب يسلم مرة واحدة فقط لكل واجب/امتحان

    def __str__(self):
        return f"تقديم {self.student.get_full_name()} لـ {self.quiz_or_assignment.material.title}"

# NEW: موديل لإجابات الطالب على الأسئلة داخل التقديم
class StudentAnswer(models.Model):
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name='answers', verbose_name='التقديم')
    question = models.ForeignKey(Question, on_delete=models.SET_NULL, blank=True, null=True, verbose_name='السؤال')
    chosen_choice = models.ForeignKey(Choice, on_delete=models.SET_NULL, blank=True, null=True, verbose_name='الخيار المختار')
    answer_text = models.TextField(blank=True, null=True, verbose_name='إجابة نصية (إذا لم تكن خيارات)')
    is_correct = models.BooleanField(default=False, verbose_name='إجابة صحيحة')

    class Meta:
        verbose_name = 'إجابة طالب'
        verbose_name_plural = 'إجابات الطلاب'
        unique_together = ('submission', 'question') # الطالب يجيب مرة واحدة فقط على السؤال في التقديم الواحد

    def __str__(self):
        return f"إجابة لـ {self.submission.student.get_full_name()} على سؤال {self.question.id}"


# **NEW: موديل الاشتراك في الكورس (Enrollment Model)**
class Enrollment(models.Model):
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='enrollments', limit_choices_to={'user_type': 'student'}, verbose_name='الطالب')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments', verbose_name='الكورس')
    enrollment_date = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الاشتراك')
    is_active = models.BooleanField(default=True, verbose_name='نشط') # هل الاشتراك لا يزال ساري المفعول

    class Meta:
        verbose_name = 'اشتراك كورس'
        verbose_name_plural = 'اشتراكات الكورسات'
        unique_together = ('student', 'course') # الطالب لا يمكنه الاشتراك في نفس الكورس مرتين

    def __str__(self):
        return f"اشتراك {self.student.get_full_name()} في {self.course.title}"
