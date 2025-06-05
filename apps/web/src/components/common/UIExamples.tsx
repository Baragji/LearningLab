import React, { useState } from "react";
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonButton,
  SkeletonList,
  SkeletonImage,
  SkeletonSection,
  SkeletonTable,
  useNotification,
} from "ui";

// Component to demonstrate enhanced Skeleton Loaders with shimmer effect
const EnhancedSkeletonExample: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Forbedrede Skeleton Loaders</h2>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Skeleton</h3>
        <div className="flex space-x-4">
          <Skeleton width={100} height={20} />
          <Skeleton width={150} height={20} />
          <Skeleton width={80} height={20} />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">
          Skeleton Text med varierende højde
        </h3>
        <SkeletonText lines={3} varyHeights={true} />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Skeleton Avatar</h3>
        <div className="flex space-x-4">
          <SkeletonAvatar size={40} />
          <SkeletonAvatar size={60} />
          <SkeletonAvatar size={80} />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">
          Skeleton Card med Header og Footer
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard height={150} />
          <SkeletonCard height={150} withHeader={true} withFooter={true} />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Nye Skeleton Komponenter</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-md font-medium mb-2">Skeleton Button</h4>
            <div className="flex space-x-4">
              <SkeletonButton />
              <SkeletonButton rounded={true} />
            </div>
          </div>
          <div>
            <h4 className="text-md font-medium mb-2">Skeleton Image</h4>
            <SkeletonImage height={120} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Skeleton List</h3>
        <SkeletonList items={3} withAvatar={true} />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Skeleton Section</h3>
        <SkeletonSection withTitle={true} contentLines={4} withDivider={true} />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Skeleton Table</h3>
        <SkeletonTable rows={3} columns={4} withHeader={true} />
      </div>
    </div>
  );
};

// Component to demonstrate enhanced Notifications with CSS animations
const EnhancedNotificationExample: React.FC = () => {
  const notification = useNotification();

  const showSuccessNotification = () => {
    notification.success(
      "Handling gennemført!",
      "Din anmodning blev behandlet med succes.",
    );
  };

  const showErrorNotification = () => {
    notification.error(
      "Der opstod en fejl",
      "Vi kunne ikke behandle din anmodning. Prøv igen senere.",
      { position: "bottom-right", duration: 7000 },
    );
  };

  const showWarningNotification = () => {
    notification.warning(
      "Advarsel",
      "Dette vil slette alle dine gemte indstillinger.",
      { position: "top-center", duration: 6000 },
    );
  };

  const showInfoNotification = () => {
    notification.info(
      "Vidste du det?",
      "Du kan tilpasse dit dashboard ved at trække og slippe widgets.",
      { position: "bottom-center", duration: 8000 },
    );
  };

  const showTopLeftNotification = () => {
    notification.info(
      "Top-Left Position",
      "Denne notifikation vises i øverste venstre hjørne.",
      { position: "top-left" },
    );
  };

  const showBottomLeftNotification = () => {
    notification.success(
      "Bottom-Left Position",
      "Denne notifikation vises i nederste venstre hjørne.",
      { position: "bottom-left" },
    );
  };

  const showLongDurationNotification = () => {
    notification.warning(
      "Lang varighed",
      "Denne notifikation forbliver synlig i 10 sekunder.",
      { duration: 10000 },
    );
  };

  const showMultipleNotifications = () => {
    // Vis flere notifikationer med kort interval
    notification.success(
      "Første notifikation",
      "Dette er den første notifikation",
    );

    setTimeout(() => {
      notification.info(
        "Anden notifikation",
        "Dette er den anden notifikation",
      );
    }, 300);

    setTimeout(() => {
      notification.warning(
        "Tredje notifikation",
        "Dette er den tredje notifikation",
      );
    }, 600);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">
        Forbedrede Notifikationer med CSS Animationer
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        De nye notifikationer understøtter forskellige positioner, varigheder og
        har flydende CSS-animationer.
      </p>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Notifikationstyper</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={showSuccessNotification}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors hover:scale-105 active:scale-95 transform duration-200"
          >
            Success
          </button>

          <button
            onClick={showErrorNotification}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors hover:scale-105 active:scale-95 transform duration-200"
          >
            Error (Bottom-Right)
          </button>

          <button
            onClick={showWarningNotification}
            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors hover:scale-105 active:scale-95 transform duration-200"
          >
            Warning (Top-Center)
          </button>

          <button
            onClick={showInfoNotification}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors hover:scale-105 active:scale-95 transform duration-200"
          >
            Info (Bottom-Center)
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Forskellige positioner</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={showTopLeftNotification}
            className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors hover:scale-105 active:scale-95 transform duration-200"
          >
            Top-Left
          </button>

          <button
            onClick={showBottomLeftNotification}
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors hover:scale-105 active:scale-95 transform duration-200"
          >
            Bottom-Left
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Avancerede funktioner</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={showLongDurationNotification}
            className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors hover:scale-105 active:scale-95 transform duration-200"
          >
            Lang varighed (10s)
          </button>

          <button
            onClick={showMultipleNotifications}
            className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors hover:scale-105 active:scale-95 transform duration-200"
          >
            Flere notifikationer
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <h3 className="text-lg font-medium mb-2">
          Sådan bruges notifikationssystemet
        </h3>
        <pre className="bg-gray-800 text-gray-100 p-4 rounded-md overflow-x-auto text-sm">
          {`// Importer useNotification hook
import { useNotification } from 'ui';

// Brug hooken i din komponent
const notification = useNotification();

// Vis forskellige typer notifikationer
notification.success('Titel', 'Besked');
notification.error('Fejl', 'Fejlbesked');
notification.warning('Advarsel', 'Advarselsbesked');
notification.info('Info', 'Informationsbesked');

// Med tilpassede indstillinger
notification.success('Titel', 'Besked', { 
  position: 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'
  duration: 5000 // millisekunder
});`}
        </pre>
      </div>
    </div>
  );
};

// Component to demonstrate real-world usage of skeleton loaders
const RealWorldSkeletonExample: React.FC<{ loading: boolean }> = ({
  loading,
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Realistisk Eksempel</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Card with Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">
              Kursus Kort
            </h3>
          </div>

          <div className="p-4">
            {loading ? (
              <>
                <SkeletonImage height="180px" className="mb-4" />
                <SkeletonText lines={1} className="mb-2 text-lg" />
                <SkeletonText lines={3} varyHeights={true} className="mb-4" />
                <div className="flex justify-between items-center">
                  <SkeletonAvatar size={32} />
                  <SkeletonButton width="120px" />
                </div>
              </>
            ) : (
              <>
                <div className="h-[180px] bg-gray-200 dark:bg-gray-700 rounded-md mb-4 flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400">
                    Kursus billede
                  </span>
                </div>
                <h4 className="text-lg font-medium mb-2 text-gray-800 dark:text-white">
                  Introduktion til React
                </h4>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Lær grundlæggende React koncepter og byg moderne
                  brugergrænseflader med denne populære JavaScript-bibliotek.
                </p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      <span>JD</span>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors hover:scale-105 active:scale-95 transform duration-200">
                    Tilmeld
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* List with Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">
              Seneste Aktiviteter
            </h3>
          </div>

          <div className="p-4">
            {loading ? (
              <SkeletonList items={4} withAvatar={true} />
            ) : (
              <div className="space-y-3">
                {[
                  {
                    user: "Maria",
                    action: "afsluttede et kursus",
                    time: "for 5 minutter siden",
                  },
                  {
                    user: "Peter",
                    action: "startede et nyt kursus",
                    time: "for 1 time siden",
                  },
                  {
                    user: "Sofie",
                    action: "bestod en quiz",
                    time: "for 3 timer siden",
                  },
                  {
                    user: "Anders",
                    action: "tilføjede en kommentar",
                    time: "i går",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-md animate-fadeInDown"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                      {item.user.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {item.user} {item.action}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table with Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mt-8">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">
              Kursus Statistik
            </h3>
          </div>

          <div className="p-4">
            {loading ? (
              <SkeletonTable rows={4} columns={3} withHeader={true} />
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Kursus
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Deltagere
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Gennemførelsesrate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {[
                        {
                          course: "Introduktion til React",
                          participants: 120,
                          completion: "78%",
                        },
                        {
                          course: "Advanced TypeScript",
                          participants: 85,
                          completion: "64%",
                        },
                        {
                          course: "UI/UX Design Basics",
                          participants: 150,
                          completion: "92%",
                        },
                        {
                          course: "Node.js Backend Development",
                          participants: 95,
                          completion: "71%",
                        },
                      ].map((item, index) => (
                        <tr
                          key={index}
                          className="animate-fadeInDown"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-white">
                            {item.course}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            {item.participants}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            {item.completion}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main component that combines all examples
const UIExamples = () => {
  const [loading, setLoading] = useState(true);

  // Toggle loading state
  const toggleLoading = () => {
    setLoading(!loading);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-12">
      <div className="animate-fadeInUp">
        <h1 className="text-2xl font-bold mb-6">Forbedrede UI Komponenter</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Denne side viser eksempler på de forbedrede UI-komponenter, der er
          implementeret i LearningLab.
        </p>

        <div className="mb-8">
          <button
            onClick={toggleLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors hover:scale-105 active:scale-95 transform duration-200"
          >
            {loading ? "Vis indhold" : "Vis skeleton loaders"}
          </button>
        </div>
      </div>

      {/* Enhanced Skeleton Loaders Example */}
      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md animate-fadeInUp"
        style={{ animationDelay: "100ms" }}
      >
        <EnhancedSkeletonExample />
      </div>

      {/* Real-world Skeleton Example */}
      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md animate-fadeInUp"
        style={{ animationDelay: "200ms" }}
      >
        <RealWorldSkeletonExample loading={loading} />
      </div>

      {/* Enhanced Notification Example */}
      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md animate-fadeInUp"
        style={{ animationDelay: "300ms" }}
      >
        <EnhancedNotificationExample />
      </div>

      {/* Glassmorphism Header Example */}
      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md animate-fadeInUp"
        style={{ animationDelay: "400ms" }}
      >
        <h2 className="text-xl font-semibold mb-4">
          Glassmorphism Header med Scroll Progress
        </h2>
        <p className="mb-4">
          Den nye header med glassmorphism-effekt er allerede implementeret og
          kan ses, når du scroller ned på siden. Den inkluderer nu også en
          scroll progress-indikator og forbedrede CSS-animationer.
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors hover:scale-105 active:scale-95 transform duration-200"
          >
            Scroll til toppen
          </button>
          <button
            onClick={() =>
              window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "smooth",
              })
            }
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors hover:scale-105 active:scale-95 transform duration-200"
          >
            Scroll til bunden
          </button>
        </div>
      </div>
    </div>
  );
};

export default UIExamples;
