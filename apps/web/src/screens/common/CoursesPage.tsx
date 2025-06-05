"use client";

import React, { useState, useEffect } from "react";
import { useGetCoursesQuery } from "../../store/services/api";
import { CourseCard } from "../../components/CourseCard";
import { toast } from "react-hot-toast";

const CoursesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [allCourses, setAllCourses] = useState<any[]>([]);

  const limit = 12;
  const offset = currentPage * limit;

  const {
    data: coursesData,
    isLoading,
    error,
    refetch,
  } = useGetCoursesQuery({
    search: searchTerm || undefined,
    level: selectedLevel || undefined,
    limit,
    offset,
  });

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
    setAllCourses([]);
  }, [searchTerm, selectedLevel]);

  // Accumulate courses for infinite scroll
  useEffect(() => {
    if (coursesData?.courses) {
      if (currentPage === 0) {
        setAllCourses(coursesData.courses);
      } else {
        setAllCourses((prev) => [...prev, ...coursesData.courses]);
      }
    }
  }, [coursesData, currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  const handleLoadMore = () => {
    if (coursesData?.hasMore) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const levels = ["Begynder", "Mellem", "Avanceret"];

  if (error) {
    toast.error("Fejl ved indlæsning af kurser");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Udforsk kurser
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find det perfekte kursus til din læring. Browse gennem vores
              udvalg af kurser og tilmeld dig dem, der interesserer dig.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <form
            onSubmit={handleSearch}
            className="space-y-4 md:space-y-0 md:flex md:items-end md:space-x-4"
          >
            {/* Search Input */}
            <div className="flex-1">
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Søg kurser
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Søg efter kursustitel eller beskrivelse..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Level Filter */}
            <div className="md:w-48">
              <label
                htmlFor="level"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Sværhedsgrad
              </label>
              <select
                id="level"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Alle niveauer</option>
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Søger..." : "Søg"}
              </button>
            </div>
          </form>

          {/* Clear Filters */}
          {(searchTerm || selectedLevel) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedLevel("");
                }}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Ryd alle filtre
              </button>
            </div>
          )}
        </div>

        {/* Results Summary */}
        {coursesData && (
          <div className="mb-6">
            <p className="text-gray-600">
              Viser {allCourses.length} af {coursesData.total} kurser
              {(searchTerm || selectedLevel) && " (filtreret)"}
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && currentPage === 0 && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Indlæser kurser...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Fejl ved indlæsning
            </h3>
            <p className="text-gray-600 mb-4">
              Der opstod en fejl ved indlæsning af kurser.
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Prøv igen
            </button>
          </div>
        )}

        {/* No Results */}
        {!isLoading && !error && allCourses.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ingen kurser fundet
            </h3>
            <p className="text-gray-600">
              {searchTerm || selectedLevel
                ? "Prøv at justere dine søgekriterier."
                : "Der er ingen kurser tilgængelige i øjeblikket."}
            </p>
          </div>
        )}

        {/* Courses Grid */}
        {allCourses.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {allCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>

            {/* Load More Button */}
            {coursesData?.hasMore && (
              <div className="text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? "Indlæser..." : "Indlæs flere kurser"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CoursesPage;
