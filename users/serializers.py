from djoser.serializers import UserCreateSerializer, UserSerializer
from rest_framework import serializers
from .models import CustomUser, AccountRequest 
from rest_framework.authtoken.models import Token 


class CustomUserCreateSerializer(UserCreateSerializer):
    class Meta(UserCreateSerializer.Meta):
        model = CustomUser
        fields = ('id', 'email', 'first_name', 'last_name', 'password', 'user_type', 'gender', 'governorate', 
                  'specialized_subject', 'phone_number', 'personal_id_card', 'cv_file')


class CustomUserSerializer(UserSerializer):
    user_image = serializers.SerializerMethodField()
    balance = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta(UserSerializer.Meta):
        model = CustomUser
        fields = ['id', 'email', 'first_name', 'last_name', 'user_type', 'user_image', 'specialized_subject', 
                  'gender', 'governorate', 'phone_number', 'balance',
                  'qualifications', 'experience', 'what_will_you_add', 
                  'instagram_link', 'facebook_link', 'website_link',
                  'academic_level', 'academic_track', 'second_name', 'third_name', 
                  'parent_father_phone_number', 'parent_mother_phone_number', 
                  'school_name', 'parent_profession', 'teacher_name_for_student',
                  'job_position', 'expected_salary', 'address', 'previous_work_experience',
                  'personal_id_card', 'cv_file']
        read_only_fields = fields 

    def get_user_image(self, obj):
        if obj.image and hasattr(obj.image, 'url'): 
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.image.url)
            return None 
        return None 


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    token = serializers.CharField(read_only=True)
    user_type = serializers.CharField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True) 
    user_image = serializers.CharField(read_only=True) 
    specialized_subject = serializers.CharField(read_only=True)
    balance = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            try:
                user = CustomUser.objects.get(email=email)
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError('بيانات الاعتماد غير صحيحة.')

            if user.check_password(password):
                token, created = Token.objects.get_or_create(user=user)
                data['token'] = token.key
                data['user_type'] = user.user_type
                data['first_name'] = user.first_name
                data['last_name'] = user.last_name 
                
                request = self.context.get('request')
                if user.image and hasattr(user.image, 'url'):
                    if request is not None:
                        data['user_image'] = request.build_absolute_uri(user.image.url)
                    else:
                        data['user_image'] = user.image.url
                else:
                    data['user_image'] = None 

                if user.user_type == 'teacher':
                    data['specialized_subject'] = user.specialized_subject
                
                data['balance'] = user.balance 

                return data
            else:
                raise serializers.ValidationError('بيانات الاعتماد غير صحيحة.')
        else:
            raise serializers.ValidationError('يجب توفير البريد الإلكتروني وكلمة المرور.')

class AccountRequestSerializer(serializers.ModelSerializer):
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        label='تأكيد كلمة المرور'
    )
    # specialized_subject تم نقلها إلى CustomUser CreateSerializer
    # personal_id_card و cv_file تم نقلها إلى CustomUser
    specialized_subject = serializers.CharField(write_only=True, required=False) # هذا الحقل كان هنا، لكنه الآن يجب أن يتم معالجته بشكل مختلف
    
    class Meta:
        model = AccountRequest
        fields = [
            'id', 'email', 'password', 'password_confirm', 'user_type',
            'first_name', 'last_name', 'phone_number', 'gender', 'governorate',
            'second_name', 'third_name', 'parent_father_phone_number', 'parent_mother_phone_number',
            'school_name', 'parent_profession', 'teacher_name_for_student', 'academic_level',
            'academic_track', 'qualifications', 'experience', 'category_type', 'what_will_you_add',
            'job_position', 'expected_salary', 'address', 'previous_work_experience',
            'instagram_link', 'facebook_link', 'website_link',
            'status', 'rejection_reason', 'request_date'
        ]
        read_only_fields = ('status', 'request_date',)
        extra_kwargs = {
            'password': {'write_only': True, 'style': {'input_type': 'password'}},
            'second_name': {'required': False}, 'third_name': {'required': False},
            'phone_number': {'required': False}, 'parent_father_phone_number': {'required': False},
            'parent_mother_phone_number': {'required': False}, 'school_name': {'required': False},
            'parent_profession': {'required': False}, 'teacher_name_for_student': {'required': False},
            'gender': {'required': False}, 'governorate': {'required': False},
            'academic_level': {'required': False}, 'academic_track': {'required': False},
            'category_type': {'required': False}, 
            'what_will_you_add': {'required': False},
            'job_position': {'required': False}, 'expected_salary': {'required': False},
            'address': {'required': False}, 'previous_work_experience': {'required': False},
            'instagram_link': {'required': False}, 'facebook_link': {'required': False},
            'website_link': {'required': False}, 
            'qualifications': {'required': False},
            'experience': {'required': False},
        }

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "كلمتا المرور غير متطابقتين."})
        
        user_type = data.get('user_type')

        if user_type == 'student':
            required_fields = ['first_name', 'last_name', 'phone_number', 'parent_father_phone_number',
                             'school_name', 'parent_profession', 'governorate', 'academic_level',
                             'academic_track', 'gender']
            for field in required_fields:
                if not data.get(field):
                    raise serializers.ValidationError({field: f"هذا الحقل مطلوب للطالب."})

        elif user_type == 'teacher':
            # **NEW: استخدام category_type بدلاً من specialized_subject ليتوافق مع AccountRequest model**
            if not data.get('category_type'):
                raise serializers.ValidationError({"category_type": "المادة المتخصصة (الفئة) مطلوبة للأستاذ."})
            
            required_fields = ['first_name', 'last_name', 'phone_number', 'qualifications',
                             'experience', 'category_type', 'what_will_you_add']
            for field in required_fields:
                if not data.get(field):
                    raise serializers.ValidationError({field: f"هذا الحقل مطلوب للأستاذ."})
            

        elif user_type == 'team_member':
            required_fields = ['first_name', 'last_name', 'phone_number', 'job_position',
                             'expected_salary', 'what_will_you_add', 'governorate', 'address',
                             'previous_work_experience']
            for field in required_fields:
                if not data.get(field):
                    raise serializers.ValidationError({field: f"هذا الحقل مطلوب لعضو فريق العمل."})
            return data

        def create(self, validated_data):
            validated_data.pop('password_confirm') 
            # specialized_subject_data لم تعد بحاجة للـ pop هنا
            specialized_subject_data = validated_data.pop('specialized_subject', None) # **هذا السطر قد يسبب مشكلة إذا لم يكن موجوداً في validated_data**
            
            account_request = AccountRequest.objects.create(**validated_data)
            return account_request

    class TeacherProfileSerializer(serializers.ModelSerializer):
        specialized_subject_display = serializers.CharField(source='get_specialized_subject_display', read_only=True)
        user_image = serializers.SerializerMethodField() 

        class Meta:
            model = CustomUser
            fields = ['id', 'email', 'first_name', 'last_name', 'user_type', 'user_image', 
                      'specialized_subject', 'specialized_subject_display', 
                      'gender', 'governorate', 'phone_number', 
                      'qualifications', 'experience', 'what_will_you_add',
                      'instagram_link', 'facebook_link', 'website_link'] 
            read_only_fields = fields 

        def get_user_image(self, obj):
            if obj.image and hasattr(obj.image, 'url'):
                request = self.context.get('request')
                if request is not None:
                    return request.build_absolute_uri(obj.image.url)
                return None 
            return None
