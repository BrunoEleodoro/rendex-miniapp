import { Metadata } from "next";
import { WithdrawPage } from "~/components/pages/withdraw-page";

export const metadata: Metadata = {
  title: "Withdraw | RendeX",
  description: "Withdraw your funds securely with RendeX.",
};

export default function WithdrawPageRoute() {
  return <WithdrawPage />;
}