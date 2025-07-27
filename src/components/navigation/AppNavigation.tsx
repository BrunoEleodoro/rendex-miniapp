"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, TrendingUp, CreditCard } from "lucide-react";
import { Button } from "~/components/ui/Button";

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navigationItems: NavigationItem[] = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: <Home className="w-5 h-5" />
  },
  {
    path: "/invest",
    label: "Invest",
    icon: <TrendingUp className="w-5 h-5" />
  },
  {
    path: "/avenia",
    label: "Avenia",
    icon: <CreditCard className="w-5 h-5" />
  }
];

const flowPages = ["/", "/welcome", "/analysis", "/ready", "/notifications", "/dashboard"];

export function AppNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  // Don't show navigation on flow pages
  if (flowPages.includes(pathname)) {
    return null;
  }

  // // Show back button on secondary pages
  // const isSecondaryPage = !["/dashboard", "/invest", "/avenia"].includes(pathname);

  // if (isSecondaryPage) {
  //   return (
  //     <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 p-4">
  //       <Button
  //         onClick={() => router.back()}
  //         variant="ghost"
  //         size="sm"
  //         className="flex items-center gap-2"
  //       >
  //         <ArrowLeft className="w-4 h-4" />
  //         Back
  //       </Button>
  //     </div>
  //   );
  // }

  // Show bottom navigation on main pages
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
      <div className="flex items-center justify-around py-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.path;
          
          return (
            <Button
              key={item.path}
              onClick={() => router.push(item.path)}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                isActive 
                  ? "text-blue-600 bg-blue-50" 
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              {item.icon}
              <span className="text-xs">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}