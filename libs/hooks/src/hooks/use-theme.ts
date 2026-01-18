import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";

const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

type Theme = "dark" | "light"; 

type UseThemeOutput = {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: Dispatch<SetStateAction<Theme>>;
};

export const useTheme = (): UseThemeOutput => {
  const isDarkOS = useMediaQuery(COLOR_SCHEME_QUERY);
  const [isDarkMode, setDarkMode] = useState<boolean>(isDarkOS);
  const [theme, setTheme] = useLocalStorage<Theme>("theme", isDarkOS ? "dark" : "light");

  useEffect(() => {
    switch (theme) {
      case "light": {
        setDarkMode(false);
        break;
      }
      case "dark": {
        setDarkMode(true);
        break;
      }
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((prevMode) => (prevMode === "light" ? "dark" : "light"));
  }

  return {
    theme,
    setTheme,
    isDarkMode,
    toggleTheme,
  };
};