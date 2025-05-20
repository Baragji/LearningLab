// apps/web/pages/lessons/[id].tsx
import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Define types for our lesson data
interface LessonLink {
  id: number;
  title: string;
}

interface LessonContent {
  type: string;
  content: string;
}

interface Lesson {
  id: number;
  title: string;
  courseId: number;
  courseSlug: string;
  courseTitle: string;
  moduleId: number;
  moduleTitle: string;
  content: LessonContent[];
  prevLesson: LessonLink | null;
  nextLesson: LessonLink | null;
}

const LessonDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  // Mock lesson data - in a real app, you would fetch this based on the id
  const lesson: Lesson = {
    id: 101,
    title: 'Hvad er React?',
    courseId: 1,
    courseSlug: 'react-fundamentals',
    courseTitle: 'React Fundamentals',
    moduleId: 1,
    moduleTitle: 'Introduktion til React',
    content: [
      {
        type: 'text',
        content: `
          <h2>Introduktion til React</h2>
          <p>React er et JavaScript-bibliotek til at bygge brugergrænseflader, udviklet og vedligeholdt af Facebook. Det blev først udgivet i 2013 og har siden da vokset til at blive et af de mest populære frontend-værktøjer.</p>
          
          <h3>Hvorfor React?</h3>
          <p>React løser mange af de udfordringer, som udviklere står over for, når de bygger komplekse brugergrænseflader:</p>
          <ul>
            <li><strong>Deklarativ kodestil:</strong> React gør det nemt at skabe interaktive UIs. Design simple visninger for hver tilstand i din applikation, og React vil effektivt opdatere og rendere de rette komponenter, når dine data ændrer sig.</li>
            <li><strong>Komponentbaseret:</strong> Byg indkapslede komponenter, der håndterer deres egen tilstand, og sammensæt dem for at lave komplekse brugergrænseflader.</li>
            <li><strong>Lær én gang, skriv overalt:</strong> React er ikke begrænset til web. Du kan også bygge mobile apps med React Native og endda desktop-applikationer.</li>
          </ul>
          
          <h3>Virtual DOM</h3>
          <p>En af de vigtigste funktioner i React er det virtuelle DOM (Document Object Model). I stedet for at opdatere DOM'en direkte, når din applikations tilstand ændrer sig, opdaterer React først en virtuel repræsentation af DOM'en. Derefter sammenligner den denne virtuelle repræsentation med den faktiske DOM og opdaterer kun de elementer, der er ændret.</p>
          <p>Dette gør React meget effektiv, da DOM-manipulationer er dyre operationer, der kan påvirke ydeevnen.</p>
          
          <h3>JSX</h3>
          <p>React bruger JSX, en syntaksudvidelse til JavaScript, der ligner HTML. Med JSX kan du skrive HTML-lignende kode i dine JavaScript-filer, hvilket gør det nemmere at visualisere UI'en, du bygger.</p>
          
          <pre><code>
          const element = &lt;h1&gt;Hello, world!&lt;/h1&gt;;
          </code></pre>
          
          <p>Dette er ikke en streng eller HTML - det er JSX, og det bliver kompileret til JavaScript-funktionskald.</p>
          
          <h3>Komponenter</h3>
          <p>Komponenter er byggestenene i React. En komponent er en isoleret del af UI'en, der har sin egen logik og præsentation. Komponenter kan være så små som en knap eller så store som en hel side.</p>
          
          <p>I de næste lektioner vil vi dykke dybere ned i, hvordan man opretter og bruger komponenter i React.</p>
        `,
      },
    ],
    prevLesson: null,
    nextLesson: {
      id: 102,
      title: 'Opsætning af udviklingsmiljø',
    },
  };

  if (router.isFallback) {
    return <div className="text-center py-10">Indlæser lektion...</div>;
  }

  return (
    <>
      <Head>
        <title>{lesson.title} | {lesson.courseTitle} | LearningLab</title>
      </Head>
      <div>
        {/* Breadcrumb */}
        <nav className="flex mb-4 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/courses" className="hover:text-gray-700 dark:hover:text-gray-200">
            Kurser
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/courses/${lesson.courseSlug}`} className="hover:text-gray-700 dark:hover:text-gray-200">
            {lesson.courseTitle}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700 dark:text-gray-200">{lesson.title}</span>
        </nav>
        
        {/* Lesson header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{lesson.title}</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {lesson.moduleTitle} • Lektion {id}
          </p>
        </div>
        
        {/* Lesson content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="prose dark:prose-invert max-w-none">
            {lesson.content.map((block, index) => (
              <div key={index} dangerouslySetInnerHTML={{ __html: block.content }} />
            ))}
          </div>
        </div>
        
        {/* Lesson navigation */}
        <div className="flex justify-between">
          {lesson.prevLesson ? (
            <Link 
              href={`/lessons/${lesson.prevLesson.id}`}
              className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md shadow hover:bg-gray-50 dark:hover:bg-gray-750"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {lesson.prevLesson.title}
            </Link>
          ) : (
            <div></div>
          )}
          
          {lesson.nextLesson && (
            <Link 
              href={`/lessons/${lesson.nextLesson.id}`}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700"
            >
              {lesson.nextLesson.title}
              <svg className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </>
  );
};

export default LessonDetail;