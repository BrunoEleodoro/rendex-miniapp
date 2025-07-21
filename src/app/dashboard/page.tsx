import { Metadata } from "next";
import { DashboardScreen } from "~/components/screens/dashboard-screen";

export const metadata: Metadata = {
  title: "Dashboard | RendeX",
  description: "Your RendeX dashboard - manage investments, check balances, and make PIX payments.",
};

export default function DashboardPage() {
  return <DashboardScreen />;
}