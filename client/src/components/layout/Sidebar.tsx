import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();

  if (!user) return null;

  const menuItems = [
    {
      name: "Dashboard",
      icon: "fas fa-tachometer-alt",
      path: "/",
      roles: ["patient", "doctor", "admin"],
    },
    {
      name: "Doctors",
      icon: "fas fa-user-md",
      path: "/doctors",
      roles: ["patient", "admin"],
    },
    {
      name: "Appointments",
      icon: "fas fa-calendar-alt",
      path: "/appointments",
      roles: ["patient", "doctor", "admin"],
    },
    {
      name: "My Schedule",
      icon: "fas fa-calendar-check",
      path: "/schedule",
      roles: ["doctor"],
    },
    {
      name: "Admin Dashboard",
      icon: "fas fa-shield-alt",
      path: "/admin",
      roles: ["admin"],
    },
    {
      name: "Profile",
      icon: "fas fa-user-circle",
      path: "/profile",
      roles: ["patient", "doctor", "admin"],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user.role)
  );

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside className={cn("h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col", className)}>
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <i className="fas fa-heartbeat text-sidebar-primary text-2xl"></i>
          <span className="font-bold text-sidebar-primary text-xl">MediBook</span>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => (
            <li key={item.name}>
              <button
                onClick={() => setLocation(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-md text-sidebar-foreground transition-colors",
                  location === item.path
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent/50"
                )}
              >
                <i className={`${item.icon} w-5 text-center`}></i>
                <span>{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sidebar-accent-foreground font-semibold">
              {user.name.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium text-sidebar-foreground">{user.name}</p>
            <span className="text-xs text-sidebar-foreground/70 capitalize">{user.role}</span>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3 rounded-md text-red-600 hover:bg-sidebar-accent/50 transition-colors"
        >
          <i className="fas fa-sign-out-alt w-5 text-center"></i>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
