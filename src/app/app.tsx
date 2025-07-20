"use client";

import dynamic from "next/dynamic";

// Import the RendeX Brazilian FinTech app
const RendexAppComponent = dynamic(() => import("~/components/rendex-app").then(mod => ({ default: mod.RendexApp })), {
  ssr: false,
});

export default function App() {
  return <RendexAppComponent />;
}
