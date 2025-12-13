// apps/client/src/libs/toast.ts
export const toast = {
  success: (message: string) => {
    console.log('✅', message);
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(`✅ ${message}`);
    }
  },
  error: (message: string) => {
    console.error('❌', message);
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(`❌ ${message}`);
    }
  },
};