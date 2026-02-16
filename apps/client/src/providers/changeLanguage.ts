// import { dynamicActivate } from "../libs/lingui";
// import { updateUser } from "../services/user";
// import { useAuthStore } from "../stores/auth";

// export const changeLanguage = async (locale: string) => {
//   // Persist locale
//   localStorage.setItem("locale", locale);

//   // Activate immediately (NO reload)
//   await dynamicActivate(locale);

//   // Update auth store so provider reacts
//   const state = useAuthStore.getState();

//   if (state.user) {
//     state.setUser({
//       ...state.user,
//       locale,
//     });

//     // Backend sync (non-blocking)
//     updateUser({ locale }).catch(() => null);
//   }
// };



// Update ../providers/changeLanguage
import { dynamicActivate } from "../libs/lingui";
import { updateLocale } from "../services/user/locale"; // New import
import { useAuthStore } from "../stores/auth";

export const changeLanguage = async (locale: string) => {
  // Persist locale
  localStorage.setItem("locale", locale);

  // Activate immediately (NO reload)
  await dynamicActivate(locale);

  // Update auth store so provider reacts
  const state = useAuthStore.getState();

  if (state.user) {
    state.setUser({
      ...state.user,
      locale,
    });

    // Use dedicated locale endpoint (non-blocking)
    updateLocale(locale).catch((error) => {
      console.error("Failed to update locale on server:", error);
      // Optionally show a toast notification
    });
  }
};