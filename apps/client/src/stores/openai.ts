// src/client/stores/openai.ts
// import { create } from "zustand";
// import { DEFAULT_MAX_TOKENS, DEFAULT_MODEL } from "../constants/llm";

// type OpenAIStore = {
//   model: string;
//   maxTokens: number;
//   setModel: (model: string) => void;
//   setMaxTokens: (maxTokens: number) => void;
// };

// export const useOpenAiStore = create<OpenAIStore>((set) => ({
//   model: DEFAULT_MODEL,
//   maxTokens: DEFAULT_MAX_TOKENS,
//   setModel: (model: string) => set({ model }),
//   setMaxTokens: (maxTokens: number) => set({ maxTokens }),
// }));





import { create } from "zustand";
import { persist } from "zustand/middleware";

import { DEFAULT_MAX_TOKENS, DEFAULT_MODEL } from "../constants/llm";

type OpenAIStore = {
  baseURL: string | null;
  setBaseURL: (baseURL: string | null) => void;
  apiKey: string | null;
  setApiKey: (apiKey: string | null) => void;
  model: string | null;
  setModel: (model: string | null) => void;
  maxTokens: number | null;
  setMaxTokens: (maxTokens: number | null) => void;
};

export const useOpenAiStore = create<OpenAIStore>()(
  persist(
    (set) => ({
      baseURL: null,
      setBaseURL: (baseURL: string | null) => {
        set({ baseURL });
      },
      apiKey: null,
      setApiKey: (apiKey: string | null) => {
        set({ apiKey });
      },
      model: DEFAULT_MODEL,
      setModel: (model: string | null) => {
        set({ model });
      },
      maxTokens: DEFAULT_MAX_TOKENS,
      setMaxTokens: (maxTokens: number | null) => {
        set({ maxTokens });
      },
    }),
    { name: "openai" },
  ),
);
