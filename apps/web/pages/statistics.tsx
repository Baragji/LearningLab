// apps/web/pages/statistics.tsx
import React from 'react';
import Head from 'next/head';
import { useGetUserStatisticsQuery } from '../src/store/services/api';

const Statistics: React.FC = () => {
  // Fetch user statistics (includes quiz results)
  const { 
    data: userStats, 
    isLoading: isLoadingStats, 
    error: statsError 
  } = useGetUserStatisticsQuery();

  // Extract quiz results from userStats
  const quizResults = userStats?.quizResults || [];

  // Calculate additional statistics
  const completedQuizzes = quizResults.length;

  // Calculate average score if there are quiz results
  let averageScore = 'N/A';
  if (quizResults.length > 0) {
    const totalScorePercentage = quizResults.reduce((sum, result) => {
      return sum + (result.correctAnswers / result.totalQuestions * 100);
    }, 0);
    averageScore = (totalScorePercentage / quizResults.length).toFixed(0) + '%';
  }

  // Loading state
  if (isLoadingStats) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Statistik | LearningLab</title>
      </Head>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Min Statistik</h1>
        </div>

        {/* Error state */}
        {statsError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>Der opstod en fejl ved indlæsning af din statistik. Prøv igen senere.</p>
          </div>
        )}

        {/* XP Stats */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-yellow-50 dark:bg-yellow-900 p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-yellow-700 dark:text-yellow-200 mb-2">Total XP</h2>
              <p className="text-3xl font-bold text-yellow-800 dark:text-yellow-100">{userStats.totalXp || 0} XP</p>
            </div>

            <div className="bg-green-50 dark:bg-green-900 p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-green-700 dark:text-green-200 mb-2">Gennemførte Quizzer</h2>
              <p className="text-3xl font-bold text-green-800 dark:text-green-100">{completedQuizzes}</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-blue-700 dark:text-blue-200 mb-2">Gennemsnitlig Score</h2>
              <p className="text-3xl font-bold text-blue-800 dark:text-blue-100">
                {averageScore}
              </p>
            </div>
          </div>
        )}

        {/* Quiz Results */}
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mt-8 mb-4">Quiz Resultater</h2>

        {/* Empty state */}
        {(!quizResults || quizResults.length === 0) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">Du har ikke gennemført nogen quizzer endnu.</p>
          </div>
        )}

        {/* Quiz results table */}
        {quizResults && quizResults.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Quiz
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Score
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    XP Optjent
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Dato
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {quizResults.map((result) => {
                  // Calculate score percentage
                  const scorePercentage = result.correctAnswers / result.totalQuestions * 100;

                  // Format date
                  const formattedDate = new Date(result.completedAt).toLocaleDateString('da-DK', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });

                  return (
                    <tr key={result.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{result.quizTitle}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{result.courseName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {scorePercentage.toFixed(0)}% ({result.correctAnswers}/{result.totalQuestions})
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{result.xpEarned} XP</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formattedDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default Statistics;
