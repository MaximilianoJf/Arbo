import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import es from "./locales/es.json";
import en from "./locales/en.json";

const savedLang = localStorage.getItem("arbo-lang") || "es";

i18n.use(initReactI18next).init({
    resources: {
        es: { translation: es },
        en: { translation: en },
    },
    lng: savedLang,
    fallbackLng: "es",
    interpolation: { escapeValue: false },
});

/** Persist language choice */
i18n.on("languageChanged", (lng) => {
    localStorage.setItem("arbo-lang", lng);
});

export default i18n;
