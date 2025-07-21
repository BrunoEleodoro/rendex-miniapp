import { Metadata } from "next";
import { PixInvestPage } from "~/components/pages/pix-invest-page";

export const metadata: Metadata = {
  title: "PIX Invest | RendeX",
  description: "Invest using PIX - Brazil's instant payment system integrated with RendeX.",
};

export default function PixInvestPageRoute() {
  return <PixInvestPage />;
}