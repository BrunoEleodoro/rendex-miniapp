import { Metadata } from "next";
import { InvestPage } from "~/components/pages/invest-page";

export const metadata: Metadata = {
  title: "Invest | RendeX",
  description: "Start investing with RendeX - PIX Invest, cryptocurrency options, and more.",
};

export default function InvestPageRoute() {
  return <InvestPage />;
}