// apps/web/pages/_app.tsx
import type { AppProps } from "next/app";
import { Provider as ReduxProvider } from "react-redux";
import store from "../src/store";
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import Layout from '../src/components/layout/Layout';
import "../src/styles/global.css";
import { useRouter } from 'next/router';

// Pages that don't use the main layout
const noLayoutPages = ['/login', '/signup', '/forgot-password', '/reset-password'];

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const shouldUseLayout = !noLayoutPages.includes(router.pathname);

  return (
    <ReduxProvider store={store}>
      <ThemeProvider>
        <AuthProvider>
          {shouldUseLayout ? (
            <Layout>
              <Component {...pageProps} />
            </Layout>
          ) : (
            <Component {...pageProps} />
          )}
        </AuthProvider>
      </ThemeProvider>
    </ReduxProvider>
  );
}

export default MyApp;
