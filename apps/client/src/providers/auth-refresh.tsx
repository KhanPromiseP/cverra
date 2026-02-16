// import { useEffect, useRef } from "react";

// import { axios } from "../libs/axios";
// import { refreshToken } from "../services/auth/refresh";
// import { useAuthStore } from "../stores/auth";

// type Props = {
//   children: React.ReactNode;
// };

// /**
//  * The AuthRefreshProvider wrapper is responsible for refreshing
//  * the access token every 5 minutes while the user is authenticated.
//  *
//  * @param children The children to render.
//  */
// export const AuthRefreshProvider = ({ children }: Props) => {
//   const intervalId = useRef<NodeJS.Timeout>();
//   const isLoggedIn = useAuthStore((state) => !!state.user);

//   useEffect(() => {
//     if (!isLoggedIn && intervalId.current) {
//       clearInterval(intervalId.current);
//       return;
//     }

//     const _refreshToken = () => refreshToken(axios);
//     intervalId.current = setInterval(_refreshToken, 5 * 60 * 1000);

//     return () => {
//       clearInterval(intervalId.current);
//     };
//   }, [isLoggedIn]);

//   return children;
// };


// import { useEffect, useRef, useCallback } from "react";
// import { axios } from "../libs/axios";
// import { refreshToken } from "../services/auth/refresh";
// import { useAuthStore } from "../stores/auth";

// type Props = {
//   children: React.ReactNode;
//   refreshInterval?: number; // in milliseconds
//   maxRetries?: number;
// };

// /**
//  * The AuthRefreshProvider wrapper is responsible for refreshing
//  * the access token periodically while the user is authenticated.
//  *
//  * @param children The children to render.
//  * @param refreshInterval How often to attempt refresh (default: 5 minutes)
//  * @param maxRetries Maximum consecutive failures before logout (default: 3)
//  */
// export const AuthRefreshProvider = ({ 
//   children, 
//   refreshInterval = 5 * 60 * 1000, // 5 minutes
//   maxRetries = 3 
// }: Props) => {
//   const intervalId = useRef<NodeJS.Timeout>();
//   const retryCount = useRef<number>(0);
//   const isRefreshing = useRef<boolean>(false);
  
//   const user = useAuthStore((state) => state.user);
//   const setUser = useAuthStore((state) => state.setUser);
//   const isLoggedIn = !!user;

//   const handleRefresh = useCallback(async () => {
//     // Prevent multiple simultaneous refresh attempts
//     if (isRefreshing.current) {
//       console.log('⏳ Refresh already in progress, skipping...');
//       return;
//     }

//     // Don't refresh if user is not logged in
//     if (!isLoggedIn) {
//       console.log('👤 User not logged in, skipping refresh');
//       return;
//     }

//     try {
//       isRefreshing.current = true;
//       console.log('🔄 Attempting token refresh...');
      
//       // Attempt to refresh the token
//       await refreshToken(axios);
      
//       // Success! Reset retry count
//       retryCount.current = 0;
//       console.log('✅ Token refresh successful');
      
//     } catch (error) {
//       // Increment retry count on failure
//       retryCount.current += 1;
//       console.error(`❌ Token refresh failed (attempt ${retryCount.current}/${maxRetries}):`, error);
      
//       // If we've exceeded max retries, log the user out
//       if (retryCount.current >= maxRetries) {
//         console.log('🚫 Max refresh retries exceeded. Logging out...');
        
//         // Clear user from store (logout)
//         setUser(null);
        
//         // Clear the interval
//         if (intervalId.current) {
//           clearInterval(intervalId.current);
//           intervalId.current = undefined;
//         }
        
//         // Optionally redirect to login
//         // You might want to import and use your router here
//         // window.location.href = '/auth/login';
//       }
//     } finally {
//       isRefreshing.current = false;
//     }
//   }, [isLoggedIn, maxRetries, setUser]);

//   useEffect(() => {
//     // Clear interval if user logs out
//     if (!isLoggedIn) {
//       if (intervalId.current) {
//         console.log('🛑 User logged out, clearing refresh interval');
//         clearInterval(intervalId.current);
//         intervalId.current = undefined;
//       }
//       // Reset retry count
//       retryCount.current = 0;
//       return;
//     }

//     // Don't set another interval if one already exists
//     if (intervalId.current) {
//       return;
//     }

//     console.log('⏰ Setting up token refresh interval');
    
//     // Do an immediate refresh when component mounts
//     // This ensures we have a valid token right away
//     handleRefresh();

//     // Set up periodic refresh
//     intervalId.current = setInterval(handleRefresh, refreshInterval);

//     // Cleanup function
//     return () => {
//       if (intervalId.current) {
//         console.log('🧹 Cleaning up refresh interval');
//         clearInterval(intervalId.current);
//         intervalId.current = undefined;
//       }
//     };
//   }, [isLoggedIn, handleRefresh, refreshInterval]);

//   // Handle page visibility changes (user returns to tab)
//   useEffect(() => {
//     const handleVisibilityChange = () => {
//       if (document.visibilityState === 'visible' && isLoggedIn) {
//         console.log('👁️ Page became visible, refreshing token...');
//         handleRefresh();
//       }
//     };

//     document.addEventListener('visibilitychange', handleVisibilityChange);

//     return () => {
//       document.removeEventListener('visibilitychange', handleVisibilityChange);
//     };
//   }, [isLoggedIn, handleRefresh]);

//   // Handle online/offline status
//   useEffect(() => {
//     const handleOnline = () => {
//       if (isLoggedIn) {
//         console.log('🌐 Connection restored, refreshing token...');
//         handleRefresh();
//       }
//     };

//     window.addEventListener('online', handleOnline);

//     return () => {
//       window.removeEventListener('online', handleOnline);
//     };
//   }, [isLoggedIn, handleRefresh]);

//   return children;
// };



// small delay before first refresh to let database sync after login/2FA
import { useEffect, useRef, useCallback } from "react";
import { axios } from "../libs/axios";
import { refreshToken } from "../services/auth/refresh";
import { useAuthStore } from "../stores/auth";

type Props = {
  children: React.ReactNode;
  refreshInterval?: number; // in milliseconds
  maxRetries?: number;
  initialRefreshDelay?: number; // Add this
};

export const AuthRefreshProvider = ({ 
  children, 
  refreshInterval = 5 * 60 * 1000, // 5 minutes
  maxRetries = 3,
  initialRefreshDelay = 10000 // Wait 10 seconds before first refresh
}: Props) => {
  const intervalId = useRef<NodeJS.Timeout>();
  const initialTimeoutId = useRef<NodeJS.Timeout>(); // Add this
  const retryCount = useRef<number>(0);
  const isRefreshing = useRef<boolean>(false);
  
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const isLoggedIn = !!user;

  const handleRefresh = useCallback(async () => {
    // Prevent multiple simultaneous refresh attempts
    if (isRefreshing.current) {
      console.log('⏳ Refresh already in progress, skipping...');
      return;
    }

    // Don't refresh if user is not logged in
    if (!isLoggedIn) {
      console.log('👤 User not logged in, skipping refresh');
      return;
    }

    try {
      isRefreshing.current = true;
      console.log('🔄 Attempting token refresh...');
      
      // Attempt to refresh the token
      await refreshToken(axios);
      
      // Success! Reset retry count
      retryCount.current = 0;
      console.log('✅ Token refresh successful');
      
    } catch (error) {
      // Increment retry count on failure
      retryCount.current += 1;
      console.error(`❌ Token refresh failed (attempt ${retryCount.current}/${maxRetries}):`, error);
      
      // If we've exceeded max retries, log the user out
      if (retryCount.current >= maxRetries) {
        console.log('🚫 Max refresh retries exceeded. Logging out...');
        
        // Clear user from store (logout)
        setUser(null);
        
        // Clear the interval
        if (intervalId.current) {
          clearInterval(intervalId.current);
          intervalId.current = undefined;
        }
        
        // Clear the initial timeout
        if (initialTimeoutId.current) {
          clearTimeout(initialTimeoutId.current);
          initialTimeoutId.current = undefined;
        }
        
        // Redirect to login
        window.location.href = '/auth/login';
      }
    } finally {
      isRefreshing.current = false;
    }
  }, [isLoggedIn, maxRetries, setUser]);

  useEffect(() => {
    // Clear everything if user logs out
    if (!isLoggedIn) {
      if (intervalId.current) {
        console.log('🛑 User logged out, clearing refresh interval');
        clearInterval(intervalId.current);
        intervalId.current = undefined;
      }
      if (initialTimeoutId.current) {
        clearTimeout(initialTimeoutId.current);
        initialTimeoutId.current = undefined;
      }
      // Reset retry count
      retryCount.current = 0;
      return;
    }

    // Don't set up if already running
    if (intervalId.current || initialTimeoutId.current) {
      return;
    }

    console.log(`⏰ Setting up token refresh with ${initialRefreshDelay}ms initial delay...`);
    
    // ⚡ CRITICAL: Wait before first refresh to let database sync
    initialTimeoutId.current = setTimeout(() => {
      console.log('🔄 Executing initial refresh after delay');
      handleRefresh();
      
      // Then set up periodic refresh
      intervalId.current = setInterval(handleRefresh, refreshInterval);
      initialTimeoutId.current = undefined;
    }, initialRefreshDelay);

    // Cleanup function
    return () => {
      if (initialTimeoutId.current) {
        console.log('🧹 Cleaning up initial refresh timeout');
        clearTimeout(initialTimeoutId.current);
        initialTimeoutId.current = undefined;
      }
      if (intervalId.current) {
        console.log('🧹 Cleaning up refresh interval');
        clearInterval(intervalId.current);
        intervalId.current = undefined;
      }
    };
  }, [isLoggedIn, handleRefresh, refreshInterval, initialRefreshDelay]);

  // Handle page visibility changes (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isLoggedIn) {
        console.log('👁️ Page became visible, refreshing token...');
        handleRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoggedIn, handleRefresh]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      if (isLoggedIn) {
        console.log('🌐 Connection restored, refreshing token...');
        handleRefresh();
      }
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [isLoggedIn, handleRefresh]);

  return children;
};