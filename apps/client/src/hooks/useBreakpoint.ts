import { Grid } from 'antd';

const { useBreakpoint: antdUseBreakpoint } = Grid;

// Custom hook with better mobile detection
export const useBreakpoint = () => {
  const screens = antdUseBreakpoint();
  
  // Enhanced mobile detection
  const isMobile = !screens.md || screens.xs || screens.sm;
  
  return {
    ...screens,
    isMobile,
    isDesktop: screens.md && !screens.xs && !screens.sm,
  };
};