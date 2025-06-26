from django.contrib import admin
from .models import Course, Lecture, Material, QuizOrAssignment, Question, Choice, Submission, StudentAnswer, Enrollment

# Register your models here.

# Course Admin
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'teacher', 'academic_level', 'subject', 'price', 'is_published', 'created_at')
    list_filter = ('academic_level', 'subject', 'is_published', 'course_type', 'teacher__user_type') # فلترة حسب نوع المعلم
    search_fields = ('title', 'description', 'teacher__first_name', 'teacher__last_name')
    raw_id_fields = ('teacher',) # لتحسين أداء اختيار المعلم في حال وجود عدد كبير من المستخدمين
    date_hierarchy = 'created_at' # لإضافة فلتر بالزمن
    # يمكنك إضافة 'inlines' هنا لإدارة المحاضرات مباشرة من صفحة الكورس في لوحة الإدارة
    # inlines = [LectureInline] # يتطلب تعريف LectureInline

admin.site.register(Course, CourseAdmin)


# Lecture Admin
class MaterialInline(admin.TabularInline): # لعرض المواد داخل صفحة المحاضرة
    model = Material
    extra = 1 # عدد الصفوف الفارغة الإضافية
    fields = ('title', 'type', 'file', 'url', 'text_content', 'order', 'is_published')
    raw_id_fields = ('lecture',) # إذا أردت تحسين الأداء لـ ForeignKey


class LectureAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order', 'is_published', 'is_locked', 'required_quiz_or_exam')
    list_filter = ('is_published', 'is_locked', 'course__title', 'course__academic_level', 'course__subject')
    search_fields = ('title', 'description', 'course__title')
    inlines = [MaterialInline] # تضمين المواد مباشرة
    raw_id_fields = ('course', 'required_quiz_or_exam',)
    
    # تحسين عرض is_locked في القائمة
    def is_locked_display(self, obj):
        return obj.is_locked
    is_locked_display.boolean = True
    is_locked_display.short_description = 'مقفلة؟'

admin.site.register(Lecture, LectureAdmin)


# Material Admin
class MaterialAdmin(admin.ModelAdmin):
    list_display = ('title', 'lecture', 'type', 'order', 'is_published')
    list_filter = ('type', 'is_published', 'lecture__course__title', 'lecture__title')
    search_fields = ('title', 'text_content', 'url')
    raw_id_fields = ('lecture',)

admin.site.register(Material, MaterialAdmin)


# QuizOrAssignment Admin
class QuestionInline(admin.TabularInline): # لعرض الأسئلة داخل صفحة الواجب/الامتحان
    model = Question
    extra = 1
    fields = ('question_text', 'points') # لا تعرض الخيارات هنا بشكل مباشر
    show_change_link = True # للسماح بالانتقال لتعديل السؤال وخياراته

class QuizOrAssignmentAdmin(admin.ModelAdmin):
    list_display = ('material', 'duration_minutes', 'passing_score_percentage')
    list_filter = ('material__type',) # فلترة حسب نوع المادة المرتبطة (واجب/امتحان)
    search_fields = ('material__title',)
    inlines = [QuestionInline]
    raw_id_fields = ('material',)

admin.site.register(QuizOrAssignment, QuizOrAssignmentAdmin)


# Question Admin
class ChoiceInline(admin.TabularInline): # لعرض الخيارات داخل صفحة السؤال
    model = Choice
    extra = 1
    fields = ('choice_text', 'is_correct')


class QuestionAdmin(admin.ModelAdmin):
    list_display = ('question_text', 'quiz_or_assignment', 'points')
    list_filter = ('quiz_or_assignment__material__title',)
    search_fields = ('question_text',)
    inlines = [ChoiceInline]
    raw_id_fields = ('quiz_or_assignment',)

admin.site.register(Question, QuestionAdmin)


# Choice Admin
class ChoiceAdmin(admin.ModelAdmin):
    list_display = ('choice_text', 'question', 'is_correct')
    list_filter = ('is_correct', 'question__quiz_or_assignment__material__title',)
    search_fields = ('choice_text',)
    raw_id_fields = ('question',)

admin.site.register(Choice, ChoiceAdmin)


# Submission Admin
class StudentAnswerInline(admin.TabularInline): # لعرض إجابات الطالب داخل التقديم
    model = StudentAnswer
    extra = 0 # لا توجد صفوف فارغة افتراضياً
    fields = ('question', 'chosen_choice', 'answer_text', 'is_correct')
    readonly_fields = ('question', 'chosen_choice', 'answer_text', 'is_correct') # للقراءة فقط
    can_delete = False # لا يمكن حذف الإجابات من هنا


class SubmissionAdmin(admin.ModelAdmin):
    list_display = ('quiz_or_assignment', 'student', 'submitted_at', 'score', 'is_graded', 'passed')
    list_filter = ('is_graded', 'passed', 'quiz_or_assignment__material__title', 'student__email')
    search_fields = ('student__email', 'quiz_or_assignment__material__title')
    inlines = [StudentAnswerInline]
    raw_id_fields = ('quiz_or_assignment', 'student')
    readonly_fields = ('submitted_at', 'score', 'is_graded', 'passed') # هذه الحقول يتم حسابها أو تعيينها تلقائياً

    # لتوفير إجراء يدوياً لتصحيح الاختبار إذا لم يكن آلياً
    actions = ['grade_submissions']

    def grade_submissions(self, request, queryset):
        for submission in queryset:
            if not submission.is_graded:
                # منطق التصحيح: (يمكن تحسينه بناءً على نوع الأسئلة)
                total_score = 0
                total_points_possible = 0
                correct_answers_count = 0
                for answer in submission.answers.all():
                    total_points_possible += answer.question.points
                    if answer.chosen_choice and answer.chosen_choice.is_correct:
                        total_score += answer.question.points
                        correct_answers_count += 1
                    # إذا كانت الإجابة نصية، سيتم تصحيحها يدوياً من قبل المعلم لاحقاً

                if total_points_possible > 0:
                    submission.score = (total_score / total_points_possible) * 100
                else:
                    submission.score = 0 # لا توجد أسئلة أو نقاط

                # تحديد ما إذا كان قد اجتاز الاختبار
                if submission.quiz_or_assignment.passing_score_percentage:
                    submission.passed = submission.score >= submission.quiz_or_assignment.passing_score_percentage
                else:
                    submission.passed = False # لا يوجد نسبة نجاح محددة

                submission.is_graded = True
                submission.save()
        self.message_user(request, "تم تصحيح التقديمات المختارة.")
    grade_submissions.short_description = "تصحيح التقديمات المختارة"

admin.site.register(Submission, SubmissionAdmin)


# StudentAnswer Admin
class StudentAnswerAdmin(admin.ModelAdmin):
    list_display = ('question', 'student_display', 'chosen_choice', 'is_correct')
    list_filter = ('is_correct', 'question__quiz_or_assignment__material__title', 'submission__student__email')
    search_fields = ('question__question_text', 'chosen_choice__choice_text', 'submission__student__email')
    raw_id_fields = ('submission', 'question', 'chosen_choice')

    def student_display(self, obj):
        return obj.submission.student.get_full_name()
    student_display.short_description = 'الطالب'

admin.site.register(StudentAnswer, StudentAnswerAdmin)


# Enrollment Admin
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'enrollment_date', 'is_active')
    list_filter = ('is_active', 'enrollment_date', 'course__title', 'student__email')
    search_fields = ('student__email', 'course__title')
    raw_id_fields = ('student', 'course')
    date_hierarchy = 'enrollment_date'

admin.site.register(Enrollment, EnrollmentAdmin)
