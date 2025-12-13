
// import OpenAI from "openai";

// // read directly from Vite environment variables
// const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
// const baseURL = import.meta.env.VITE_OPENAI_BASE_URL ?? "https://api.openai.com/v1";

// if (!apiKey) throw new Error("VITE_OPENAI_API_KEY is not set in your .env");

// export const openai = new OpenAI({
//   apiKey,
//   baseURL,
//   dangerouslyAllowBrowser: true, // required for frontend usage
// });


import { t } from "@lingui/macro";
import { OpenAI } from "openai";

import { useOpenAiStore } from "@/client/stores/openai";

export const openai = () => {
  const { apiKey, baseURL } = useOpenAiStore.getState();

  if (!apiKey) {
    throw new Error(
      // t`Your OpenAI API Key has not been set yet. Please go to your account settings to enable OpenAI Integration.`,
      t`error.`,
    );
  }

  if (baseURL) {
    return new OpenAI({
      apiKey,
      baseURL,
      dangerouslyAllowBrowser: true,
    });
  }

  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
};
