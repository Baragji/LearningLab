import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../src/contexts/AuthContext';

const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // If user is already logged in, redirect to dashboard
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
    <>
      <Head>
        <title>LearningLab - Moderne Læringsplatform</title>
        <meta name="description" content="Oplev fremtidens læring med AI-drevet personalisering og moderne design" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Hero Section with Glassmorphism */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 glassmorphism">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">LL</span>
                </div>
                <span className="ml-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  LearningLab
                </span>
              </div>
              <div className="flex space-x-4">
                <Link 
                  href="/login" 
                  className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium"
                >
                  Log ind
                </Link>
                <Link 
                  href="/signup" 
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 font-medium"
                >
                  Kom i gang
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 opacity-0 animate-fadeInDown">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Fremtidens
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">
                Læringsplatform
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto opacity-0 animate-fadeInDown" style={{ animationDelay: '0.2s' }}>
              Oplev personaliseret læring med AI-drevet teknologi, moderne design og engagerende gamification
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 opacity-0 animate-fadeInDown" style={{ animationDelay: '0.4s' }}>
              <Link 
                href="/signup" 
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 font-semibold text-lg"
              >
                Start din læringsrejse
              </Link>
              <Link 
                href="/courses" 
                className="px-8 py-4 card-glassmorphism text-gray-700 dark:text-gray-200 rounded-xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 font-semibold text-lg"
              >
                Udforsk kurser
              </Link>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-8 mt-20">
              {[
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  ),
                  title: "AI-Drevet Læring",
                  description: "Personaliserede læringsforløb tilpasset din læringsstil og tempo"
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                  title: "Interaktive Quizzer",
                  description: "Engagerende quizzer med øjeblikkelig feedback og adaptive sværhedsgrad"
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  title: "Gamification",
                  description: "Optjen XP, badges og konkurrér med andre i en motiverende læringsoplevelse"
                }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="card-glassmorphism p-8 text-center hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 opacity-0 animate-fadeInDown"
                  style={{ animationDelay: `${0.6 + index * 0.2}s` }}
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl mb-4 shadow-lg">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="card-glassmorphism p-8 rounded-2xl">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              {[
                { number: "10,000+", label: "Aktive Brugere" },
                { number: "500+", label: "Kurser" },
                { number: "95%", label: "Gennemførelsesrate" },
                { number: "4.9/5", label: "Brugertilfredshed" }
              ].map((stat, index) => (
                <div key={index} className="opacity-0 animate-fadeInDown" style={{ animationDelay: `${1.2 + index * 0.1}s` }}>
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="relative z-10 text-center pb-20">
          <div className="opacity-0 animate-fadeInDown" style={{ animationDelay: '1.6s' }}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Klar til at transformere din læring?
            </h2>
            <Link 
              href="/signup" 
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 font-semibold text-lg"
            >
              Kom i gang gratis
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default LandingPage;
