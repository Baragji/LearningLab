// apps/web/pages/_app.tsx
import type { AppProps } from "next/app";
import { Provider as ReduxProvider } from "react-redux"; // Omdøb for klarhed, hvis du bruger Redux
import store from "../src/store"; // Din Redux store
import { AuthProvider } from '../src/context/AuthContext'; // <--- TILFØJ DENNE LINJE
import "../src/styles/global.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    // Yderst er ReduxProvider, hvis du bruger Redux
    <ReduxProvider store={store}>
      {/* Indeni ReduxProvider (eller yderst hvis du ikke bruger Redux), wrapper vi med AuthProvider */}
      <AuthProvider> 
        <Component {...pageProps} />
      </AuthProvider>
    </ReduxProvider>
  );
}

export default MyApp;
