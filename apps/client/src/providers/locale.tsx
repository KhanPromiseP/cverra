// import { i18n } from "@lingui/core";
// import { I18nProvider } from "@lingui/react";

// type Props = {
//   children: React.ReactNode;
// };

// export const LocaleProvider = ({ children }: Props) => {
//   return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
// };




// import "@/client/libs/dayjs";

// import { i18n } from "@lingui/core";
// import { I18nProvider } from "@lingui/react";
// import { languages } from "@reactive-resume/utils";
// import { useEffect, useRef } from "react";

// import { defaultLocale, dynamicActivate } from "../libs/lingui";

// type Props = {
//   children: React.ReactNode;
// };

// export const LocaleProvider = ({ children }: Props) => {
//   const activatedRef = useRef<string | null>(null);

//   useEffect(() => {
//     const storedLocale =
//       localStorage.getItem("locale") || defaultLocale;

//     if (activatedRef.current === storedLocale) return;

//     if (languages.some((l) => l.locale === storedLocale)) {
//       activatedRef.current = storedLocale;
//       void dynamicActivate(storedLocale);
//     } else {
//       activatedRef.current = defaultLocale;
//       void dynamicActivate(defaultLocale);
//     }
//   }, []);

//   return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
// };







import "@/client/libs/dayjs";

import { i18n } from "@lingui/core";
import { detect, fromStorage, fromUrl } from "@lingui/detect-locale";
import { I18nProvider } from "@lingui/react";
import { languages } from "@reactive-resume/utils";
import { useEffect } from "react";

import { defaultLocale, dynamicActivate } from "../libs/lingui";
import { updateUser } from "../services/user";
import { useAuthStore } from "../stores/auth";

type Props = {
  children: React.ReactNode;
};

export const LocaleProvider = ({ children }: Props) => {
  const userLocale = useAuthStore((state) => state.user?.locale ?? defaultLocale);

  useEffect(() => {
    const detectedLocale =
      detect(fromUrl("locale"), fromStorage("locale"), userLocale, defaultLocale) ?? defaultLocale;

    // Activate the locale only if it's supported
    if (languages.some((lang) => lang.locale === detectedLocale)) {
      void dynamicActivate(detectedLocale);
    } else {
      void dynamicActivate(defaultLocale);
    }
  }, [userLocale]);

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
};

export const changeLanguage = async (locale: string) => {
  // Update locale in local storage
  window.localStorage.setItem("locale", locale);

  // Update locale in user profile, if authenticated
  const state = useAuthStore.getState();
  if (state.user) await updateUser({ locale }).catch(() => null);

  // Reload the page for language switch to take effect
  window.location.reload();
};
