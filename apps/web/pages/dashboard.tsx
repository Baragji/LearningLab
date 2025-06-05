// apps/web/pages/dashboard.tsx
import React from "react";
import Head from "next/head";
import Link from "next/link";
import {
  useGetUserCoursesQuery,
  useGetUserStatisticsQuery,
  useGetCurrentUserQuery,
} from "../src/store/services/api";

const Dashboard: React.FC = () => {
  // Fetch user courses and progress
  const {
    data: userCoursesData,
    isLoading: isLoadingCourses,
    error: coursesError,
  } = useGetUserCoursesQuery();

  // Fetch user statistics
  const {
    data: userStats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useGetUserStatisticsQuery();

  // Fetch current user
  const { data: currentUser, isLoading: isLoadingUser } =
    useGetCurrentUserQuery();

  // Calculate stats
  const activeCourses = userCoursesData?.courses?.length || 0;
  const completedCourses =
    userCoursesData?.courses?.filter(
      (course) => userCoursesData.progress[course.id] === 100,
    )?.length || 0;

  // Calculate overall progress
  const calculateOverallProgress = () => {
    if (!userCoursesData?.courses?.length) return 0;

    const totalProgress = Object.values(userCoursesData.progress || {}).reduce(
      (sum, progress) => sum + progress,
      0,
    );

    return Math.round(totalProgress / userCoursesData.courses.length);
  };

  const overallProgress = calculateOverallProgress();

  // Loading state
  if (isLoadingCourses || isLoadingStats || isLoadingUser) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard | LearningLab</title>
      </Head>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          {currentUser && (
            <p className="text-gray-600 dark:text-gray-300">
              Velkommen, {currentUser.name || currentUser.email}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stats Card */}
          <div className="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-blue-700 dark:text-blue-200 mb-2">
              Aktive Kurser
            </h2>
            <p className="text-3xl font-bold text-blue-800 dark:text-blue-100">
              {activeCourses}
            </p>
          </div>

          {/* Stats Card */}
          <div className="bg-green-50 dark:bg-green-900 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-green-700 dark:text-green-200 mb-2">
              Gennemførte Kurser
            </h2>
            <p className="text-3xl font-bold text-green-800 dark:text-green-100">
              {completedCourses}
            </p>
          </div>

          {/* Stats Card */}
          <div className="bg-purple-50 dark:bg-purple-900 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-purple-700 dark:text-purple-200 mb-2">
              Samlet Fremskridt
            </h2>
            <p className="text-3xl font-bold text-purple-800 dark:text-purple-100">
              {overallProgress}%
            </p>
          </div>
        </div>

        {/* XP Stats */}
        {userStats && (
          <div className="bg-yellow-50 dark:bg-yellow-900 p-6 rounded-lg shadow mt-6">
            <h2 className="text-lg font-semibold text-yellow-700 dark:text-yellow-200 mb-2">
              Total XP
            </h2>
            <p className="text-3xl font-bold text-yellow-800 dark:text-yellow-100">
              {userStats.totalXp || 0} XP
            </p>
          </div>
        )}

        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mt-8 mb-4">
          Dine Kurser
        </h2>

        {/* Error state */}
        {coursesError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>
              Der opstod en fejl ved indlæsning af dine kurser. Prøv igen
              senere.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!coursesError &&
          (!userCoursesData?.courses ||
            userCoursesData.courses.length === 0) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Du har ikke påbegyndt nogen kurser endnu.
              </p>
              <Link
                href="/courses"
                className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700"
              >
                Udforsk kurser
              </Link>
            </div>
          )}

        {/* Course grid */}
        {userCoursesData?.courses && userCoursesData.courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userCoursesData.courses.map((course) => {
              const progress = userCoursesData.progress[course.id] || 0;

              // Generate a gradient color based on course ID
              const gradientColors = [
                ["from-blue-500 to-purple-600", "blue-600"],
                ["from-green-500 to-teal-600", "green-600"],
                ["from-indigo-500 to-purple-600", "indigo-600"],
                ["from-red-500 to-pink-600", "red-600"],
                ["from-yellow-500 to-orange-600", "yellow-600"],
              ];

              const colorIndex = course.id % gradientColors.length;
              const [gradient, progressColor] = gradientColors[colorIndex];

              return (
                <Link
                  href={`/courses/${course.id}`}
                  key={course.id}
                  className="block"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div
                      className={`h-40 bg-gradient-to-r ${gradient} flex items-center justify-center`}
                    >
                      <span className="text-white text-xl font-bold">
                        {course.title}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {course.description}
                      </p>
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                          <div
                            className={`bg-${progressColor} h-2.5 rounded-full`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {progress}% gennemført
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
