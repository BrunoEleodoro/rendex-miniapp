import { Metadata } from "next";
import { ReadyScreen } from "~/components/screens/ready-screen";

export const metadata: Metadata = {
  title: "Account Ready | RendeX",
  description: "Your RendeX account is ready! Start investing and managing your finances.",
};

export default function ReadyPage() {
  return <ReadyScreen />;
}