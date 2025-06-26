// frontend/src/constants/academicStructure.js

const academicStructure = {
    // Academic Levels (الصف الدراسي) - **خاص بالثانوية العامة فقط**
    academicLevels: {
        "secondary": {
            label: "ثانوي عام", // يمكن تغيير التسمية لتكون أكثر وضوحاً
            tracks: {
                "grade10": { label: "الصف الأول الثانوي" },
                "grade11": { label: "الصف الثاني الثانوي" },
                "grade12": { label: "الصف الثالث الثانوي" },
            }
        },
    },

    // Subjects (المواد الدراسية)
    subjects: {
        "arabic": { label: "اللغة العربية", academicLevels: ["secondary"] },
        "english": { label: "اللغة الإنجليزية", academicLevels: ["secondary"] },
        "math_general": { label: "الرياضيات (عام)", academicLevels: ["secondary"] }, // للعام
        "math_applied": { label: "الرياضيات التطبيقية", academicLevels: ["secondary"] }, // للعلمي رياضة
        "math_pure": { label: "الرياضيات البحتة", academicLevels: ["secondary"] }, // للعلمي رياضة
        "physics": { label: "الفيزياء", academicLevels: ["secondary"] },
        "chemistry": { label: "الكيمياء", academicLevels: ["secondary"] },
        "biology": { label: "الأحياء", academicLevels: ["secondary"] },
        "geology": { label: "الجيولوجيا وعلوم البيئة", academicLevels: ["secondary"] },
        "history": { label: "التاريخ", academicLevels: ["secondary"] },
        "geography": { label: "الجغرافيا", academicLevels: ["secondary"] },
        "philosophy": { label: "الفلسفة والمنطق", academicLevels: ["secondary"] },
        "psychology": { label: "علم النفس والاجتماع", academicLevels: ["secondary"] },
        "computer": { label: "الحاسب الآلي", academicLevels: ["secondary"] },
        "religious": { label: "التربية الدينية", academicLevels: ["secondary"] },
        "citizenship": { label: "التربية الوطنية", academicLevels: ["secondary"] },
        "economy": { label: "الاقتصاد والإحصاء", academicLevels: ["secondary"] },
        "french": { label: "اللغة الفرنسية", academicLevels: ["secondary"] },
        "german": { label: "اللغة الألمانية", academicLevels: ["secondary"] },
        "italian": { label: "اللغة الإيطالية", academicLevels: ["secondary"] },
        "spanish": { label: "اللغة الإسبانية", academicLevels: ["secondary"] },
        "physical_education": { label: "التربية البدنية", academicLevels: ["primary", "preparatory", "secondary"] },
    },

    // Job Positions (لفريق العمل)
    jobPositions: {
        "teacher_assistant": { label: "مساعد مدرس" },
        "admin_assistant": { label: "مساعد إداري" },
        "content_creator": { label: "صانع محتوى" },
        "technical_support": { label: "دعم فني" },
        "marketing_specialist": { label: "أخصائي تسويق" },
        "hr_specialist": { label: "أخصائي موارد بشرية" },
        "financial_manager": { label: "مدير مالي" },
    },

    // Genders (الجنس)
    genders: {
        "male": { label: "ذكر" },
        "female": { label: "أنثى" },
    },

    // Governorates (المحافظات) - Example for Egypt
    governorates: {
        "cairo": { label: "القاهرة" },
        "alexandria": { label: "الإسكندرية" },
        "giza": { label: "الجيزة" },
        "sharqia": { label: "الشرقية" },
        "dakahlia": { label: "الدقهلية" },
        "beheira": { label: "البحيرة" },
        "qalyubia": { label: "القليوبية" },
        "menoufia": { label: "المنوفية" },
        "gharbia": { label: "الغربية" },
        "fayoum": { label: "الفيوم" },
        "beni_suef": { label: "بني سويف" },
        "minya": { label: "المنيا" },
        "asyut": { label: "أسيوط" },
        "sohag": { label: "سوهاج" },
        "qena": { label: "قنا" },
        "luxor": { label: "الأقصر" },
        "aswan": { label: "أسوان" },
        "red_sea": { label: "البحر الأحمر" },
        "new_valley": { label: "الوادي الجديد" },
        "matrouh": { label: "مطروح" },
        "north_sinai": { label: "شمال سيناء" },
        "south_sinai": { label: "جنوب سيناء" },
        "suez": { label: "السويس" },
        "ismaillia": { label: "الإسماعيلية" },
        "port_said": { label: "بورسعيد" },
        "damietta": { label: "دمياط" },
        "kafr_el_sheikh": { label: "كفر الشيخ" },
        "monufia": { label: "المنوفية" },
    },

    // Parent Professions (مهنة ولي الأمر)
    parentProfessions: {
        "doctor": { label: "طبيب" },
        "engineer": { label: "مهندس" },
        "teacher": { label: "مدرس" },
        "businessman": { label: "رجل أعمال" },
        "government_employee": { label: "موظف حكومي" },
        "other": { label: "أخرى" },
    },

    // Helper to get all subjects flat map for easier lookup (used in homepage filters)
    get allSubjectsMap() {
        const map = {};
        for (const key in this.subjects) {
            map[key] = this.subjects[key];
        }
        return map;
    },

    // Helper to get all academic levels flat map
    get allAcademicLevelsMap() {
        const map = {};
        for (const levelKey in this.academicLevels) {
            if (this.academicLevels[levelKey].tracks) {
                for (const trackKey in this.academicLevels[levelKey].tracks) {
                    map[trackKey] = this.academicLevels[levelKey].tracks[trackKey];
                }
            } else {
                map[levelKey] = this.academicLevels[levelKey];
            }
        }
        return map;
    }
};

export default academicStructure;
