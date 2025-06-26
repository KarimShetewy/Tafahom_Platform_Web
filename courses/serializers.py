from rest_framework import serializers
from .models import Course, Lecture, Material, QuizOrAssignment, Question, Choice, Enrollment 
# استيراد CustomUserSerializer لجلب بيانات المعلم المفصلة (خاصة صورته)
from users.serializers import CustomUserSerializer 


# Serializer للخيار (Choice) داخل السؤال
class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'choice_text', 'is_correct']
        read_only_fields = ['id']

# Serializer للسؤال (Question) داخل الواجب/الامتحان
class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, required=False) # الخيارات المتداخلة

    class Meta:
        model = Question
        fields = ['id', 'question_text', 'points', 'choices']
        read_only_fields = ['id']

    def create(self, validated_data):
        choices_data = validated_data.pop('choices', [])
        question = Question.objects.create(**validated_data)
        for choice_data in choices_data:
            # هنا نستخدم QuestionSerializer's create method
            Choice.objects.create(question=question, **choice_data) 
        return question

    def update(self, instance, validated_data):
        choices_data = validated_data.pop('choices', [])
        
        # تحديث حقول السؤال
        instance.question_text = validated_data.get('question_text', instance.question_text)
        instance.points = validated_data.get('points', instance.points)
        instance.save()

        # تحديث أو إنشاء الخيارات
        # استراتيجية: حذف الخيارات القديمة وإنشاء الجديدة لتبسيط التحديث
        instance.choices.all().delete() 
        for choice_data in choices_data:
            Choice.objects.create(question=instance, **choice_data)
        return instance


# Serializer للواجب/الامتحان (QuizOrAssignment)
class QuizOrAssignmentSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, required=False) # الأسئلة المتداخلة

    class Meta:
        model = QuizOrAssignment
        fields = ['id', 'duration_minutes', 'passing_score_percentage', 'questions']
        read_only_fields = ['id']

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        quiz = QuizOrAssignment.objects.create(**validated_data)
        for question_data in questions_data:
            # هنا نستخدم QuestionSerializer's create method
            Question.objects.create(quiz_or_assignment=quiz, **question_data) 
        return quiz

    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions', [])
        
        # تحديث حقول الواجب/الامتحان
        instance.duration_minutes = validated_data.get('duration_minutes', instance.duration_minutes)
        instance.passing_score_percentage = validated_data.get('passing_score_percentage', instance.passing_score_percentage)
        instance.save()

        # تحديث أو إنشاء الأسئلة والخيارات
        # استراتيجية: حذف الأسئلة القديمة وإنشاء الجديدة لتبسيط التحديث
        instance.questions.all().delete()
        for question_data in questions_data:
            Question.objects.create(quiz_or_assignment=instance, **question_data)
        return instance


# Serializer للمادة التعليمية
class MaterialSerializer(serializers.ModelSerializer):
    # استخدام QuizOrAssignmentSerializer كـ nested serializer
    quiz_details = QuizOrAssignmentSerializer(required=False, allow_null=True)
    
    # لجلب الـ URL الكامل للملف إذا كان موجوداً
    file_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Material
        fields = ['id', 'lecture', 'title', 'type', 'file', 'file_url', 'url', 'text_content', 'order', 'is_published', 'quiz_details']
        read_only_fields = ['id', 'lecture'] # المحاضرة لا تتغير بعد الإنشاء
        extra_kwargs = {
            'file': {'write_only': True, 'required': False}, # FileField for writing
            'url': {'required': False},
            'text_content': {'required': False},
            'quiz_details': {'required': False},
        }

    def get_file_url(self, obj):
        if obj.file and hasattr(obj.file, 'url'):
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def validate(self, data):
        # validation هنا للتأكد من أن الحقول الصحيحة موجودة بناءً على 'type'
        material_type = data.get('type')
        if material_type == 'video' or material_type == 'pdf':
            if not data.get('file') and not self.instance: # إذا لم يتم إرسال ملف جديد وللتحديث لا يوجد ملف سابق
                raise serializers.ValidationError({"file": "ملف مطلوب لنوع الفيديو/PDF."})
        elif material_type == 'link':
            if not data.get('url'):
                raise serializers.ValidationError({"url": "رابط مطلوب لنوع الرابط."})
        elif material_type == 'text':
            if not data.get('text_content'):
                raise serializers.ValidationError({"text_content": "محتوى نصي مطلوب لنوع النص."})
        elif material_type == 'quiz' or material_type == 'exam':
            if 'quiz_details' in data and data['quiz_details']:
                # يتم التحقق من صحة quiz_details بواسطة QuizOrAssignmentSerializer
                pass
            else:
                pass

        return data

    def create(self, validated_data):
        quiz_details_data = validated_data.pop('quiz_details', None)
        material = Material.objects.create(**validated_data)
        if quiz_details_data:
            QuizOrAssignment.objects.create(material=material, **quiz_details_data)
        return material

    def update(self, instance, validated_data):
        quiz_details_data = validated_data.pop('quiz_details', None)
        
        # تحديث حقول المادة
        instance.title = validated_data.get('title', instance.title)
        instance.type = validated_data.get('type', instance.type)
        instance.file = validated_data.get('file', instance.file) # لتحديث الملف
        instance.url = validated_data.get('url', instance.url)
        instance.text_content = validated_data.get('text_content', instance.text_content)
        instance.order = validated_data.get('order', instance.order)
        instance.is_published = validated_data.get('is_published', instance.is_published)
        instance.save()

        # تحديث أو إنشاء تفاصيل الواجب/الامتحان
        if quiz_details_data:
            if hasattr(instance, 'quiz_details'): # إذا كان هناك تفاصيل واجب موجودة
                # تحديث التفاصيل الموجودة
                # يجب تمرير context={'request': self.context.get('request')}
                quiz_serializer = QuizOrAssignmentSerializer(instance.quiz_details, data=quiz_details_data, partial=True, context=self.context)
                quiz_serializer.is_valid(raise_exception=True)
                quiz_serializer.save()
            else: # إذا لم يكن هناك تفاصيل واجب موجودة، قم بإنشائها
                QuizOrAssignment.objects.create(material=instance, **quiz_details_data)
        elif hasattr(instance, 'quiz_details'): # إذا لم يتم إرسال بيانات quiz_details ولكن كانت موجودة سابقاً
            instance.quiz_details.delete() # حذفها

        return instance


# Serializer للمحاضرة
class LectureSerializer(serializers.ModelSerializer):
    materials = MaterialSerializer(many=True, read_only=True) # المواد nested، للقراءة فقط في المحاضرة
    
    # لجلب الواجب/الامتحان المطلوب لفتح القفل
    required_quiz_or_exam_details = QuizOrAssignmentSerializer(source='required_quiz_or_exam', read_only=True)

    class Meta:
        model = Lecture
        fields = ['id', 'course', 'title', 'description', 'order', 'is_published', 'materials', 'is_locked', 'required_quiz_or_exam', 'required_quiz_or_exam_details']
        read_only_fields = ['id', 'course', 'materials', 'required_quiz_or_exam_details'] # الكورس والمواد لا تتغير من هنا

    # يمكنك إضافة validation هنا لضمان uniqueness للترتيب داخل الكورس الواحد
    def validate(self, data):
        # التأكد من أن is_locked لا يمكن أن يكون True بدون required_quiz_or_exam
        if data.get('is_locked') and not data.get('required_quiz_or_exam'):
            raise serializers.ValidationError({"required_quiz_or_exam": "يجب تحديد واجب/امتحان مطلوب إذا كانت المحاضرة مقفلة."})
        return data


# Serializer للكورس
class CourseSerializer(serializers.ModelSerializer):
    # لعرض معلومات المعلم بدلاً من ID فقط
    teacher_name = serializers.CharField(source='teacher.first_name', read_only=True)
    teacher_last_name = serializers.CharField(source='teacher.last_name', read_only=True)
    teacher_id = serializers.IntegerField(source='teacher.id', read_only=True)
    teacher_profile_image = serializers.SerializerMethodField(read_only=True) # صورة المعلم

    # لجلب التسميات المعربة للحقول الاختيارية
    academic_level_display = serializers.CharField(source='get_academic_level_display', read_only=True)
    subject_display = serializers.CharField(source='get_subject_display', read_only=True)
    course_type_display = serializers.CharField(source='get_course_type_display', read_only=True)

    # لجلب الـ URL الكامل للصورة
    image_url = serializers.SerializerMethodField(read_only=True)

    # المحاضرات nested للقراءة فقط (لعرض تفاصيل الكورس)
    lectures = LectureSerializer(many=True, read_only=True) 

    # **NEW: حقل لبيان ما إذا كان المستخدم الحالي مسجلاً في الكورس**
    is_enrolled = serializers.SerializerMethodField() 

    class Meta:
        model = Course
        fields = ['id', 'teacher', 'teacher_name', 'teacher_last_name', 'teacher_id', 'teacher_profile_image',
                  'title', 'description', 'price', 'image', 'image_url',
                  'academic_level', 'academic_level_display', 'subject', 'subject_display',
                  'course_type', 'course_type_display', 'is_published', 'created_at', 'updated_at',
                  'lectures', 'is_enrolled']

        read_only_fields = ['id', 'teacher', 'teacher_name', 'teacher_last_name', 'teacher_id', 'teacher_profile_image',
                            'created_at', 'updated_at', 'lectures', 'academic_level_display', 'subject_display', 'course_type_display', 'image_url', 'is_enrolled']
        extra_kwargs = {
            'image': {'write_only': True, 'required': False}, # صورة الكورس للكتابة فقط
        }

    def get_image_url(self, obj):
        if obj.image and hasattr(obj.image, 'url'):
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def get_teacher_profile_image(self, obj):
        # التأكد من أن المعلم لديه صورة وأنها متاحة
        if obj.teacher and obj.teacher.image and hasattr(obj.teacher.image, 'url'):
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.teacher.image.url)
            return obj.teacher.image.url
        return None # أو مسار لصورة افتراضية للمدرس

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.user_type == 'student':
            # نحتاج إلى استيراد موديل Enrollment هنا
            from .models import Enrollment 
            return Enrollment.objects.filter(student=request.user, course=obj, is_active=True).exists()
        return False


# **NEW: Serializer لموديل الاشتراك (Enrollment)**
class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'student_name', 'course', 'course_title', 'enrollment_date', 'is_active']
        read_only_fields = ['id', 'student', 'student_name', 'course', 'course_title', 'enrollment_date', 'is_active']
