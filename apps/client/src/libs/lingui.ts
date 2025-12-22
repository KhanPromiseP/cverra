import { i18n } from "@lingui/core";
import dayjs from "dayjs";
import { dayjsLocales } from "./dayjs";

export const defaultLocale = "en-US";

// ✅ Track loaded locales
const loadedLocales = new Set<string>();

export async function dynamicActivate(locale: string) {
  try {
    // Only load if not already loaded
    if (!loadedLocales.has(locale)) {
      const { messages } = await import(`../locales/${locale}/messages.po`);
      if (messages) {
        i18n.load(locale, messages); // load without activating yet
        loadedLocales.add(locale);
      }
    }

    // Activate immediately (already cached if loaded before)
    i18n.activate(locale);

    if (dayjsLocales[locale]) {
      dayjs.locale(await dayjsLocales[locale]());
    }
  } catch {
    throw new Error(`Failed to load messages for locale: ${locale}`);
  }
}



// import { i18n } from "@lingui/core";
// import dayjs from "dayjs";

// import { dayjsLocales } from "./dayjs";

// export const defaultLocale = "en-US";

// export async function dynamicActivate(locale: string) {
//   try {
//     const { messages } = await import(`../locales/${locale}/messages.po`);

//     if (messages) {
//       i18n.loadAndActivate({ locale, messages });
//     }

//     // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
//     if (dayjsLocales[locale]) {
//       dayjs.locale(await dayjsLocales[locale]());
//     }
//   } catch {
//     // eslint-disable-next-line lingui/no-unlocalized-strings
//     throw new Error(`Failed to load messages for locale: ${locale}`);
//   }
// }
