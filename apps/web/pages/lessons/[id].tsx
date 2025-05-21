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

  // Mock lesson data - dynamisk baseret på id
  const getLessonData = (lessonId: string | string[] | undefined): Lesson => {
    // Default lesson
    const defaultLesson: Lesson = {
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

    // Lektion 2
    const lesson102: Lesson = {
      id: 102,
      title: 'Opsætning af udviklingsmiljø',
      courseId: 1,
      courseSlug: 'react-fundamentals',
      courseTitle: 'React Fundamentals',
      moduleId: 1,
      moduleTitle: 'Introduktion til React',
      content: [
        {
          type: 'text',
          content: `
            <h2>Opsætning af udviklingsmiljø til React</h2>
            <p>For at komme i gang med React, skal du have et udviklingsmiljø opsat. Der er flere måder at gøre dette på, men vi vil fokusere på den mest populære og anbefalede metode: Create React App.</p>
            
            <h3>Forudsætninger</h3>
            <p>Før du begynder, skal du sikre dig, at du har følgende installeret på din computer:</p>
            <ul>
              <li><strong>Node.js:</strong> React kræver Node.js version 14.0.0 eller nyere. Du kan downloade det fra <a href="https://nodejs.org/" target="_blank">nodejs.org</a>.</li>
              <li><strong>npm eller Yarn:</strong> Disse er pakkeforvaltere, der hjælper dig med at installere og administrere biblioteker og afhængigheder. npm kommer med Node.js, men du kan også bruge Yarn, hvis du foretrækker det.</li>
              <li><strong>En koderedigeringsværktøj:</strong> Vi anbefaler Visual Studio Code, men du kan bruge enhver editor, du er komfortabel med.</li>
            </ul>
            
            <h3>Oprettelse af et nyt React-projekt med Create React App</h3>
            <p>Create React App er et officielt understøttet værktøj til at oprette React-applikationer med en enkelt kommando. Det opsætter dit udviklingsmiljø, så du kan bruge de nyeste JavaScript-funktioner, giver en god udvikleroplevelse og optimerer din app til produktion.</p>
            
            <p>For at oprette et nyt projekt, åbn din terminal og kør følgende kommando:</p>
            
            <pre><code>
            npx create-react-app my-app
            cd my-app
            npm start
            </code></pre>
            
            <p>Dette vil oprette en ny mappe kaldet "my-app" med en grundlæggende React-applikation, installere alle nødvendige afhængigheder og starte en udviklingsserver.</p>
            
            <h3>Projektstruktur</h3>
            <p>Efter at have oprettet dit projekt, vil du se følgende mappestruktur:</p>
            
            <pre><code>
            my-app/
              README.md
              node_modules/
              package.json
              public/
                index.html
                favicon.ico
              src/
                App.css
                App.js
                App.test.js
                index.css
                index.js
                logo.svg
            </code></pre>
            
            <p>De vigtigste filer at være opmærksom på er:</p>
            <ul>
              <li><strong>public/index.html:</strong> HTML-skabelonen for din app.</li>
              <li><strong>src/index.js:</strong> JavaScript-indgangspunktet for din app.</li>
              <li><strong>src/App.js:</strong> En React-komponent, der repræsenterer din app.</li>
            </ul>
            
            <h3>Alternative metoder</h3>
            <p>Ud over Create React App er der andre populære værktøjer til at oprette React-applikationer:</p>
            <ul>
              <li><strong>Next.js:</strong> Et React-framework med server-side rendering og statisk site generation.</li>
              <li><strong>Gatsby:</strong> Et statisk site generator baseret på React.</li>
              <li><strong>Vite:</strong> Et nyere, hurtigere build-værktøj, der også understøtter React.</li>
            </ul>
            
            <p>I næste lektion vil vi dykke ned i at skrive din første React-komponent!</p>
          `,
        },
      ],
      prevLesson: {
        id: 101,
        title: 'Hvad er React?',
      },
      nextLesson: {
        id: 103,
        title: 'Din første React-komponent',
      },
    };

    // Lektion 3
    const lesson103: Lesson = {
      id: 103,
      title: 'Din første React-komponent',
      courseId: 1,
      courseSlug: 'react-fundamentals',
      courseTitle: 'React Fundamentals',
      moduleId: 1,
      moduleTitle: 'Introduktion til React',
      content: [
        {
          type: 'text',
          content: `
            <h2>Din første React-komponent</h2>
            <p>Nu hvor du har dit udviklingsmiljø opsat, er det tid til at skrive din første React-komponent. Komponenter er byggestenene i React, og de giver dig mulighed for at opdele din UI i uafhængige, genanvendelige dele.</p>
            
            <h3>Hvad er en komponent?</h3>
            <p>En React-komponent er en JavaScript-funktion eller klasse, der returnerer et React-element. Dette element beskriver, hvad der skal vises på skærmen.</p>
            
            <h3>Funktionelle komponenter</h3>
            <p>Den enkleste måde at definere en komponent på er at skrive en JavaScript-funktion:</p>
            
            <pre><code>
            function Welcome(props) {
              return &lt;h1&gt;Hello, {props.name}&lt;/h1&gt;;
            }
            </code></pre>
            
            <p>Denne funktion er en gyldig React-komponent, fordi den accepterer et enkelt "props" (som står for properties) objekt argument med data og returnerer et React-element.</p>
            
            <h3>Klasse-komponenter</h3>
            <p>Du kan også definere en komponent som en ES6-klasse:</p>
            
            <pre><code>
            class Welcome extends React.Component {
              render() {
                return &lt;h1&gt;Hello, {this.props.name}&lt;/h1&gt;;
              }
            }
            </code></pre>
            
            <p>Disse to komponenter er ækvivalente fra Reacts synspunkt, men funktionelle komponenter er nu den anbefalede tilgang, især med introduktionen af Hooks i React 16.8.</p>
            
            <h3>Oprettelse af en simpel komponent</h3>
            <p>Lad os oprette en simpel komponent i vores projekt. Åbn src/App.js og erstat indholdet med følgende:</p>
            
            <pre><code>
            import React from 'react';
            
            function App() {
              return (
                &lt;div className="App"&gt;
                  &lt;header className="App-header"&gt;
                    &lt;h1&gt;Min første React-app&lt;/h1&gt;
                    &lt;p&gt;
                      Velkommen til React!
                    &lt;/p&gt;
                  &lt;/header&gt;
                &lt;/div&gt;
              );
            }
            
            export default App;
            </code></pre>
            
            <p>Dette er en simpel funktionel komponent, der returnerer nogle JSX-elementer.</p>
            
            <h3>Brug af komponenter</h3>
            <p>Nu hvor vi har defineret vores App-komponent, kan vi bruge den i andre dele af vores applikation. React-komponenter skal starte med et stort bogstav, så React kan skelne dem fra almindelige HTML-tags.</p>
            
            <p>For eksempel, i src/index.js, bruger vi App-komponenten sådan her:</p>
            
            <pre><code>
            import React from 'react';
            import ReactDOM from 'react-dom';
            import './index.css';
            import App from './App';
            
            ReactDOM.render(
              &lt;React.StrictMode&gt;
                &lt;App /&gt;
              &lt;/React.StrictMode&gt;,
              document.getElementById('root')
            );
            </code></pre>
            
            <h3>Props: Passing Data to Components</h3>
            <p>En af de vigtigste funktioner i React er muligheden for at sende data til komponenter via props. Lad os oprette en ny komponent, der bruger props:</p>
            
            <pre><code>
            function Greeting(props) {
              return &lt;h1&gt;Hello, {props.name}!&lt;/h1&gt;;
            }
            
            function App() {
              return (
                &lt;div className="App"&gt;
                  &lt;Greeting name="Alice" /&gt;
                  &lt;Greeting name="Bob" /&gt;
                  &lt;Greeting name="Charlie" /&gt;
                &lt;/div&gt;
              );
            }
            </code></pre>
            
            <p>I dette eksempel sender vi en "name" prop til Greeting-komponenten, som derefter bruger denne værdi i sin rendering.</p>
            
            <h3>Sammenfatning</h3>
            <p>Tillykke! Du har nu oprettet din første React-komponent. I de næste lektioner vil vi udforske mere avancerede koncepter som state, lifecycle-metoder og hooks.</p>
          `,
        },
      ],
      prevLesson: {
        id: 102,
        title: 'Opsætning af udviklingsmiljø',
      },
      nextLesson: null,
    };

    // Map lesson ID to the correct lesson data
    const lessonMap: Record<string, Lesson> = {
      '101': defaultLesson,
      '102': lesson102,
      '103': lesson103,
    };

    // Return the lesson data based on the ID, or default if not found
    const idToUse = Array.isArray(lessonId) ? lessonId[0] : lessonId;
    return lessonMap[idToUse as string] || defaultLesson;
  };

  // Get the lesson data based on the ID
  const lesson = getLessonData(id);

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