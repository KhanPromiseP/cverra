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


// client/app.tsx
import { StrictMode } from "react";
import * as ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router";
import { Toaster } from 'sonner';

import { router } from "./router";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = ReactDOM.createRoot(document.querySelector("#root")!);

root.render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toaster
      position="top-right"
      expand={true}
      richColors
      closeButton
      style={{ zIndex: 9999 }}
    />
  </StrictMode>,
);