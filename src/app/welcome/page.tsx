import { Metadata } from "next";
import { WelcomeScreen } from "~/components/screens/welcome-screen";

export const metadata: Metadata = {
  title: "Welcome to RendeX | Brazilian Fintech",
  description: "Start your digital banking journey with RendeX - Brazil's leading fintech platform for PIX payments and investments.",
};

export default function WelcomePage() {
  return <WelcomeScreen />;
}