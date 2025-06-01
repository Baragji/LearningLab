'use client';

import React from 'react';
import Link from 'next/link';
import { Course } from '@repo/core';
import {
  useGetCourseEnrollmentStatusQuery,
  useEnrollInCourseMutation,
  useUnenrollFromCourseMutation,
} from '../store/services/api';
import { toast } from 'react-hot-toast';

interface CourseCardProps {
  course: Course;
  showEnrollmentButton?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  showEnrollmentButton = true,
}) => {
  const {
    data: enrollmentStatus,
    isLoading: isLoadingStatus,
  } = useGetCourseEnrollmentStatusQuery(course.id);

  const [enrollInCourse, { isLoading: isEnrolling }] = useEnrollInCourseMutation();
  const [unenrollFromCourse, { isLoading: isUnenrolling }] = useUnenrollFromCourseMutation();

  const handleEnroll = async () => {
    try {
      await enrollInCourse(course.id).unwrap();
      toast.success('Du er nu tilmeldt kurset!');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Fejl ved tilmelding til kursus');
    }
  };

  const handleUnenroll = async () => {
    if (window.confirm('Er du sikker på, at du vil afmelde dig fra dette kursus? Al din fremgang vil blive slettet.')) {
      try {
        await unenrollFromCourse(course.id).unwrap();
        toast.success('Du er nu afmeldt kurset');
      } catch (error: any) {
        toast.error(error?.data?.message || 'Fejl ved afmelding fra kursus');
      }
    }
  };

  const isEnrolled = enrollmentStatus?.enrolled || false;
  const progress = enrollmentStatus?.progress || 0;

  // Calculate total lessons and quizzes
  const totalItems = course.topics?.reduce(
    (total, topic) => total + (topic.lessons?.length || 0) + (topic.quizzes?.length || 0),
    0
  ) || 0;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Course Image Placeholder */}
      <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-center">
          <h3 className="text-xl font-bold mb-2">{course.title}</h3>
          <p className="text-sm opacity-90">{course.educationProgram?.name}</p>
        </div>
      </div>

      <div className="p-6">
        {/* Course Info */}
        <div className="mb-4">
          <p className="text-gray-600 text-sm mb-2 line-clamp-3">
            {course.description || 'Ingen beskrivelse tilgængelig'}
          </p>
          
          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
            <span>Niveau: {course.level || 'Ikke angivet'}</span>
            <span>{totalItems} emner</span>
          </div>

          {/* Progress Bar (only if enrolled) */}
          {isEnrolled && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Fremgang</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* View Course Button */}
          <Link
            href={`/courses/${course.id}`}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-center text-sm font-medium"
          >
            {isEnrolled ? 'Fortsæt kursus' : 'Se kursus'}
          </Link>

          {/* Enrollment Button */}
          {showEnrollmentButton && (
            <button
              onClick={isEnrolled ? handleUnenroll : handleEnroll}
              disabled={isEnrolling || isUnenrolling || isLoadingStatus}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isEnrolled
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isEnrolling || isUnenrolling
                ? 'Behandler...'
                : isEnrolled
                ? 'Afmeld'
                : 'Tilmeld'
              }
            </button>
          )}
        </div>

        {/* Enrollment Status */}
        {!isLoadingStatus && (
          <div className="mt-3 text-center">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isEnrolled
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {isEnrolled ? '✓ Tilmeldt' : 'Ikke tilmeldt'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCard;
