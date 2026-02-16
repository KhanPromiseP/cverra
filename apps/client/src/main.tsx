// import { StrictMode } from "react";
// import * as ReactDOM from "react-dom/client";
// import { RouterProvider } from "react-router";

// import { router } from "./router";

// // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
// const root = ReactDOM.createRoot(document.querySelector("#root")!);

// root.render(
//   <StrictMode>
//     <RouterProvider router={router} />
//   </StrictMode>,
// );



// import { StrictMode } from "react";
// import * as ReactDOM from "react-dom/client";
// import { RouterProvider } from "react-router";
// import { Toaster } from 'sonner';

// import { router } from "./router";

// // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
// const root = ReactDOM.createRoot(document.querySelector("#root")!);

// root.render(
//   <StrictMode>
//     <RouterProvider router={router} />
//     <Toaster
//       position="top-right"
//       expand={true}
//       richColors
//       closeButton
//       style={{ zIndex: 9999 }}
//     />
//   </StrictMode>,
// );



import { StrictMode } from "react";
import * as ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router";
import { Toaster } from "sonner";

import { router } from "./router";
import { dynamicActivate } from "./libs/lingui";

// Set English as default locale
const defaultLocale = "en-US";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = ReactDOM.createRoot(document.querySelector("#root")!);

async function bootstrap() {
   // Auto-resume after payment return
  if (window.location.search.includes('payment_success=true')) {
    const previousUrl = localStorage.getItem('pre_payment_url') || '/dashboard';
    window.location.href = previousUrl;
  }

  

  const locale = localStorage.getItem("locale") || defaultLocale;

  // Activate the initial locale
  await dynamicActivate(locale);

  // Preload other locales in background
  // ["en-US", "fr-FR"].forEach((l) => {
  //   if (l !== locale) dynamicActivate(l);
  // });
  

  root.render(
    <StrictMode>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        expand
        richColors
        closeButton
        style={{ zIndex: 9999 }}
      />
    </StrictMode>
  );
}

bootstrap();


