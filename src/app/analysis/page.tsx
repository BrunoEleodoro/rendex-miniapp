import { Metadata } from "next";
import { AnalysisScreen } from "~/components/screens/analysis-screen";

export const metadata: Metadata = {
  title: "Account Analysis | RendeX",
  description: "Analyzing your financial profile for personalized investment recommendations.",
};

export default function AnalysisPage() {
  return <AnalysisScreen />;
}