# tafahom_project/constants.py

# Choices for CustomUser.gender
GENDER_CHOICES = (
    ('male', 'ذكر'),
    ('female', 'أنثى'),
)

# Choices for CustomUser.governorate (Example for Egypt)
GOVERNORATE_CHOICES = (
    ('cairo', 'القاهرة'),
    ('alexandria', 'الإسكندرية'),
    ('giza', 'الجيزة'),
    ('sharqia', 'الشرقية'),
    ('dakahlia', 'الدقهلية'),
    ('beheira', 'البحيرة'),
    ('qalyubia', 'القليوبية'),
    ('menoufia', 'المنوفية'),
    ('gharbia', 'الغربية'),
    ('fayoum', 'الفيوم'),
    ('beni_suef', 'بني سويف'),
    ('minya', 'المنيا'),
    ('asyut', 'أسيوط'),
    ('sohag', 'سوهاج'),
    ('qena', 'قنا'),
    ('luxor', 'الأقصر'),
    ('aswan', 'أسوان'),
    ('red_sea', 'البحر الأحمر'),
    ('new_valley', 'الوادي الجديد'),
    ('matrouh', 'مطروح'),
    ('north_sinai', 'شمال سيناء'),
    ('south_sinai', 'جنوب سيناء'),
    ('suez', 'السويس'),
    ('ismaillia', 'الإسماعيلية'),
    ('port_said', 'بورسعيد'),
    ('damietta', 'دمياط'),
    ('kafr_el_sheikh', 'كفر الشيخ'),
    # 'monufia' is a duplicate for 'menoufia' - adjusted to one unique entry
)

# Choices for CustomUser.academic_level (Secondary School only)
ACADEMIC_LEVEL_CHOICES = (
    ('secondary', 'ثانوي عام'), # Modified to reflect general secondary
)

# Choices for CustomUser.academic_track (Specific tracks within Secondary)
ACADEMIC_TRACK_CHOICES = (
    ('grade10', 'الصف الأول الثانوي'),
    ('grade11', 'الصف الثاني الثانوي'),
    ('grade12', 'الصف الثالث الثانوي'),
)

# Choices for Course.subject and CustomUser.specialized_subject (for teachers)
SUBJECT_CHOICES = (
    ('arabic', 'اللغة العربية'),
    ('english', 'اللغة الإنجليزية'),
    ('math_general', 'الرياضيات (عام)'), # General Math for secondary
    ('math_applied', 'الرياضيات التطبيقية'), # Applied Math for scientific track
    ('math_pure', 'الرياضيات البحتة'), # Pure Math for scientific track
    ('physics', 'الفيزياء'),
    ('chemistry', 'الكيمياء'),
    ('biology', 'الأحياء'),
    ('geology', 'الجيولوجيا وعلوم البيئة'), # Combined for secondary
    ('history', 'التاريخ'),
    ('geography', 'الجغرافيا'),
    ('philosophy', 'الفلسفة والمنطق'),
    ('psychology', 'علم النفس والاجتماع'),
    ('computer', 'الحاسب الآلي'),
    ('religious', 'التربية الدينية'),
    ('citizenship', 'التربية الوطنية'),
    ('economy', 'الاقتصاد والإحصاء'),
    ('french', 'اللغة الفرنسية'),
    ('german', 'اللغة الألمانية'),
    ('italian', 'اللغة الإيطالية'),
    ('spanish', 'اللغة الإسبانية'),
    ('physical_education', 'التربية البدنية'),
)

# Choices for CustomUser.parent_profession
PARENT_PROFESSION_CHOICES = (
    ('doctor', 'طبيب'),
    ('engineer', 'مهندس'),
    ('teacher', 'مدرس'),
    ('businessman', 'رجل أعمال'),
    ('government_employee', 'موظف حكومي'),
    ('other', 'أخرى'),
)

# Choices for CustomUser.job_position (for team members)
JOB_POSITION_CHOICES = (
    ('teacher_assistant', 'مساعد مدرس'),
    ('admin_assistant', 'مساعد إداري'),
    ('content_creator', 'صانع محتوى'),
    ('technical_support', 'دعم فني'),
    ('marketing_specialist', 'أخصائي تسويق'),
    ('hr_specialist', 'أخصائي موارد بشرية'),
    ('financial_manager', 'مدير مالي'),
)

# Choices for Course.course_type
COURSE_TYPE_CHOICES = (
    ('regular', 'عادي'),
    ('intensive', 'مكثف'),
    ('review', 'مراجعة'),
)

# Choices for Material.type
MATERIAL_TYPE_CHOICES = (
    ('video', 'فيديو'),
    ('pdf', 'ملف PDF'),
    ('quiz', 'واجب'),
    ('exam', 'امتحان'),
    ('link', 'رابط خارجي'),
    ('text', 'محتوى نصي'),
    ('branch', 'فرع (عنوان/مجلد)'), # لتقسيم المحاضرة إلى أجزاء
)
