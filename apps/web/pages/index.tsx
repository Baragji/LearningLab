import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useHelloQuery } from "../src/store/services/api";

export default function Home() {
  const router = useRouter();
  const { data } = useHelloQuery();
  
  useEffect(() => {
    // Redirect to dashboard
    router.push('/dashboard');
  }, [router]);

  return null; // No need to render anything as we're redirecting
}
