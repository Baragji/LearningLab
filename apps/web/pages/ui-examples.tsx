import React from "react";
import dynamic from "next/dynamic";
import Layout from "../src/components/layout/Layout";
import UIExamples from "../src/components/common/UIExamples";

// Dynamisk import af NotificationProvider for at undgå server-side rendering
const NotificationProvider = dynamic(
  () => import("ui").then((mod) => mod.NotificationProvider),
  { ssr: false }, // Deaktiverer server-side rendering
);

const UIExamplesPage = () => {
  return (
    <Layout>
      <NotificationProvider>
        <UIExamples />

        {/* Add some extra content to enable scrolling for testing the sticky header */}
        <div className="h-screen"></div>
      </NotificationProvider>
    </Layout>
  );
};

export default UIExamplesPage;
