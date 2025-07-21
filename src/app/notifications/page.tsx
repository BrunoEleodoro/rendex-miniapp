import { Metadata } from "next";
import { NotificationsScreen } from "~/components/screens/notifications-screen";

export const metadata: Metadata = {
  title: "Notifications | RendeX",
  description: "Enable notifications to stay updated on your investments and account activity.",
};

export default function NotificationsPage() {
  return <NotificationsScreen />;
}