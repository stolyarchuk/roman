export type LocaleKey = "en" | "ru";

type MetaContent = {
  title: string;
  description: string;
  ogUrl: string;
  twitterDescription: string;
  ogImage: string;
};

type EducationItem = {
  year: string;
  school: string;
  field: string;
};

type LocaleContent = {
  htmlLang: string;
  name: string;
  role: string;
  specializations: string[];
  headings: {
    work: string;
    education: string;
    languages: string;
    skills: string;
  };
  education: EducationItem[];
  languages: string[];
  skills: string[];
  footer: {
    text: string;
    linkLabel: string;
    linkHref: string;
  };
  meta: MetaContent;
};

export const contentByLocale: Record<LocaleKey, LocaleContent> = {
  en: {
    htmlLang: "en",
    name: "Roman Stolyarchuk",
    role: "IT Engineer",
    specializations: [
      "C/C++ Software Developer",
      "LLM R&D Engineer",
      "IT R&D Engineer",
    ],
    headings: {
      work: "Work Experience",
      education: "Education",
      languages: "Languages",
      skills: "Skills",
    },
    education: [
      {
        year: "2009",
        school: "Moscow Technical University of Communications and Informatics",
        field: "Information Systems and Technologies",
      },
      {
        year: "2005",
        school: "Moscow Power Engineering Institute",
        field: "Nuclear Power Plants and Installations",
      },
    ],
    languages: ["Russian - Native", "English - C1 - Advanced"],
    skills: [
      "C/C++",
      "Linux",
      "TCP/IP",
      "VoIP",
      "STL",
      "Linux Server Administration",
      "Network Equipment Administration",
      "Python",
      "PostgreSQL",
      "ROS",
      "Boost",
      "Qt",
      "gRPC",
      "OOP",
      "SQL",
      "Git",
      "OpenCV",
      "CI/CD",
      "Gitlab",
      "CMake",
      "Information Security",
    ],
    footer: {
      text: "© 2004-2026 Roman Stolyarchuk. All rights reserved.",
      linkLabel: "roman.stolyarch.uk",
      linkHref: "https://roman.stolyarch.uk",
    },
    meta: {
      title: "Roman Stolyarchuk - CV",
      description: "C++/Python Software Engineer | Software and AI",
      ogUrl: "https://roman.stolyarch.uk/en/",
      twitterDescription: "IT Engineer",
      ogImage: "https://roman.stolyarch.uk/assets/photo.png",
    },
  },
  ru: {
    htmlLang: "ru",
    name: "Роман Столярчук",
    role: "IT-инженер",
    specializations: [
      "C/C++ Разработчик",
      "Инженер R&D по LLM",
      "Инженер R&D (IT)",
    ],
    headings: {
      work: "Опыт работы",
      education: "Образование",
      languages: "Языки",
      skills: "Навыки",
    },
    education: [
      {
        year: "2009",
        school: "Московский технический университет связи и информатики",
        field: "Информационные системы и технологии",
      },
      {
        year: "2005",
        school: "Московский энергетический институт",
        field: "Атомные станции и установки",
      },
    ],
    languages: ["Русский — родной", "Английский — C1 (высокий)"],
    skills: [
      "C/C++",
      "Linux",
      "TCP/IP",
      "VoIP",
      "STL",
      "Администрирование Linux-серверов",
      "Администрирование сетевого оборудования",
      "Python",
      "PostgreSQL",
      "ROS",
      "Boost",
      "Qt",
      "gRPC",
      "ООП",
      "SQL",
      "Git",
      "OpenCV",
      "CI/CD",
      "Gitlab",
      "CMake",
      "Информационная безопасность",
    ],
    footer: {
      text: "© 2004–2026 Роман Столярчук. Все права защищены.",
      linkLabel: "roman.stolyarch.uk",
      linkHref: "https://roman.stolyarch.uk",
    },
    meta: {
      title: "Роман Столярчук — Резюме",
      description: "Инженер C++/Python | Программное обеспечение и ИИ",
      ogUrl: "https://roman.stolyarch.uk/ru/",
      twitterDescription: "IT-инженер",
      ogImage: "https://roman.stolyarch.uk/assets/photo.png",
    },
  },
};
