// apps/web/pages/_app.tsx
import type { AppProps } from "next/app";
import { Provider as ReduxProvider } from "react-redux";
import store from "../src/store";
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { ProgressProvider } from '../src/context/ProgressContext';
import Layout from '../src/components/layout/Layout';
import "../src/styles/global.css";
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { setupOfflineSyncListeners } from '../src/utils/offlineSync';

// Pages that don't use the main layout
const noLayoutPages = ['/login', '/signup', '/forgot-password', '/reset-password'];

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const shouldUseLayout = !noLayoutPages.includes(router.pathname);
  
  // Set up offline sync listeners
  useEffect(() => {
    const cleanup = setupOfflineSyncListeners();
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  return (
    <ReduxProvider store={store}>
      <ThemeProvider>
        <AuthProvider>
          <ProgressProvider>
            {shouldUseLayout ? (
              <Layout>
                <Component {...pageProps} />
              </Layout>
            ) : (
              <Component {...pageProps} />
            )}
          </ProgressProvider>
        </AuthProvider>
      </ThemeProvider>
    </ReduxProvider>
  );
}

export default MyApp;
