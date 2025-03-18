import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { UserRole } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
  Settings,
  CheckCircle,
  ClipboardList,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  // Get navigation items based on user role
  const getNavItems = () => {
    if (user.role === UserRole.DOCTOR) {
      return [
        {
          title: "Dashboard",
          href: "/doctor",
          icon: LayoutDashboard,
          active: location === "/doctor",
        },
        {
          title: "Appointments",
          href: "/doctor/appointments",
          icon: Calendar,
          active: location === "/doctor/appointments",
        },
        {
          title: "Availability",
          href: "/doctor/availability",
          icon: Clock,
          active: location === "/doctor/availability",
        },
        {
          title: "Profile",
          href: "/doctor/profile",
          icon: Settings,
          active: location === "/doctor/profile",
        },
      ];
    }

    if (user.role === UserRole.ADMIN) {
      return [
        {
          title: "Dashboard",
          href: "/admin",
          icon: LayoutDashboard,
          active: location === "/admin",
        },
        {
          title: "Doctor Approvals",
          href: "/admin/doctor-approvals",
          icon: CheckCircle,
          active: location === "/admin/doctor-approvals",
        },
        {
          title: "Users",
          href: "/admin/users",
          icon: Users,
          active: location === "/admin/users",
        },
        {
          title: "Appointments",
          href: "/admin/appointments",
          icon: ClipboardList,
          active: location === "/admin/appointments",
        },
        {
          title: "Settings",
          href: "/admin/settings",
          icon: Settings,
          active: location === "/admin/settings",
        },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  return (
    <div className={cn("flex flex-col h-full bg-white border-r", className)}>
      <div className="p-6">
        <h2 className="text-xl font-semibold">{user.role} Panel</h2>
        <p className="text-neutral-500 text-sm">
          {user.firstName} {user.lastName}
        </p>
      </div>
      <nav className="flex-1 px-4 pb-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <a
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-neutral-700 transition-all hover:bg-neutral-100",
                    item.active && "bg-primary text-white hover:bg-primary-600"
                  )}
                >
                  <item.icon size={20} />
                  <span>{item.title}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
