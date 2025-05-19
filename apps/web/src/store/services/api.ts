// Filsti: apps/web/src/store/services/api.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Hent API URL fra miljøvariabler.
// NEXT_PUBLIC_ foran navnet gør den tilgængelig i browseren for Next.js.
const baseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!baseUrl) {
  console.error("FEJL: NEXT_PUBLIC_API_URL er ikke sat. API-kald vil fejle.");
  // Du kan vælge at kaste en fejl her eller have en fallback,
  // men det er bedst at sikre, at den altid er sat.
}

export const api = createApi({
  reducerPath: "baseApi",
  baseQuery: fetchBaseQuery({
    // Brug den hentede baseUrl.
    // Hvis baseUrl er undefined (ikke sat), vil kald relativt til nuværende host:port (f.eks. localhost:3003/hello)
    // hvilket er forkert, da API'et kører på localhost:5002.
    baseUrl: baseUrl || "/api", // Fallback til /api hvis den ikke er sat, men det bør den være.
  }),
  tagTypes: [],
  endpoints: (builder) => ({
    // Endpoint for at hente "Hello World" fra API'ets rod (/)
    // API'en er på http://localhost:5002/api, så query-URL'en skal være relativ til det.
    // Hvis baseUrl er "http://localhost:5002/api", så vil query: "/" kalde "http://localhost:5002/api/"
    hello: builder.query<{ message: string }, void>({
      query: () => ({
        url: "/", // Dette vil blive tilføjet til baseUrl, f.eks. http://localhost:5002/api/
      }),
    }),
  }),
});

export const { useHelloQuery } = api;
