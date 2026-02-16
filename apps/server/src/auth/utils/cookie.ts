// import type { CookieOptions } from "express";

// export const getCookieOptions = (grantType: "access" | "refresh"): CookieOptions => {
//   // Options For Access Token
//   if (grantType === "access") {
//     return {
//       httpOnly: true,
//       sameSite: "strict",
//       secure: (process.env.PUBLIC_URL ?? "").includes("https://"),
//       expires: new Date(Date.now() + 1000 * 60 * 15), // 15 minutes from now
//     };
//   }

//   // Options For Refresh Token
//   return {
//     httpOnly: true,
//     sameSite: "strict",
//     secure: (process.env.PUBLIC_URL ?? "").includes("https://"),
//     expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
//   };
// };


import type { CookieOptions } from "express";

export const getCookieOptions = (grantType: "access" | "refresh"): CookieOptions => {
  // Check if we're in development
  const isDev = process.env.NODE_ENV === 'development';
  
  // Options For Access Token
  if (grantType === "access") {
    return {
      httpOnly: true,
      sameSite: isDev ? "lax" : "strict", // Use 'lax' for development
      secure: isDev ? false : (process.env.PUBLIC_URL ?? "").includes("https://"),
      domain: isDev ? "localhost" : undefined,
      path: "/",
      expires: new Date(Date.now() + 1000 * 60 * 15), // 15 minutes
    };
  }

  // Options For Refresh Token
  return {
    httpOnly: true,
    sameSite: isDev ? "lax" : "strict", // Use 'lax' for development
    secure: isDev ? false : (process.env.PUBLIC_URL ?? "").includes("https://"),
    domain: isDev ? "localhost" : undefined,
    path: "/",
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days
  };
};
