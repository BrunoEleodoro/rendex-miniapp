import { Metadata } from "next";
import { TransactionSuccessPage } from "~/components/pages/transaction-success-page";

export const metadata: Metadata = {
  title: "Transaction Successful | RendeX",
  description: "Your transaction has been completed successfully.",
};

export default function TransactionSuccessPageRoute() {
  return <TransactionSuccessPage />;
}