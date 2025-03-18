import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface Tab {
  title: string;
  path: string;
}

interface DashboardTabProps {
  tabs: Tab[];
  activeTab?: string;
}

export default function DashboardTab({ tabs, activeTab }: DashboardTabProps) {
  const [location, setLocation] = useLocation();

  return (
    <div className="border-b border-slate-200 mb-6">
      <div className="flex flex-nowrap overflow-x-auto space-x-4 -mb-px scrollbar-hide">
        {tabs.map((tab) => (
          <Button
            key={tab.title}
            variant="link"
            className={`py-3 px-1 font-medium text-sm whitespace-nowrap ${
              activeTab === tab.title || (activeTab === undefined && location === tab.path)
                ? "text-primary border-b-2 border-primary"
                : "text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setLocation(tab.path)}
          >
            {tab.title}
          </Button>
        ))}
      </div>
    </div>
  );
}
