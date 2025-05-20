// apps/web/pages/dashboard.tsx
import React from 'react';
import Head from 'next/head';

const Dashboard: React.FC = () => {
  return (
    <>
      <Head>
        <title>Dashboard | LearningLab</title>
      </Head>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stats Card */}
          <div className="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-blue-700 dark:text-blue-200 mb-2">Aktive Kurser</h2>
            <p className="text-3xl font-bold text-blue-800 dark:text-blue-100">3</p>
          </div>
          
          {/* Stats Card */}
          <div className="bg-green-50 dark:bg-green-900 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-green-700 dark:text-green-200 mb-2">Gennemførte Kurser</h2>
            <p className="text-3xl font-bold text-green-800 dark:text-green-100">2</p>
          </div>
          
          {/* Stats Card */}
          <div className="bg-purple-50 dark:bg-purple-900 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-purple-700 dark:text-purple-200 mb-2">Samlet Fremskridt</h2>
            <p className="text-3xl font-bold text-purple-800 dark:text-purple-100">68%</p>
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mt-8 mb-4">Dine Kurser</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Course Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="h-40 bg-gray-300 dark:bg-gray-700"></div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Introduktion til React</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Lær grundlæggende React-koncepter og byg din første app</p>
              <div className="mt-4">
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">75% gennemført</p>
              </div>
            </div>
          </div>
          
          {/* Course Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="h-40 bg-gray-300 dark:bg-gray-700"></div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">TypeScript Fundamentals</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Bliv fortrolig med TypeScript og statisk typning</p>
              <div className="mt-4">
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">45% gennemført</p>
              </div>
            </div>
          </div>
          
          {/* Course Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="h-40 bg-gray-300 dark:bg-gray-700"></div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Next.js Advanced</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Avancerede teknikker og best practices i Next.js</p>
              <div className="mt-4">
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '20%' }}></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">20% gennemført</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;