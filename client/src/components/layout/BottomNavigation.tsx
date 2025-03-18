import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function BottomNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 z-30">
      <div className="flex justify-around">
        <Link href="/">
          <a className={`flex flex-col items-center ${location === "/" ? "text-primary" : "text-slate-400"}`}>
            <i className="fas fa-home text-xl"></i>
            <span className="text-xs mt-1">Home</span>
          </a>
        </Link>
        <Link href="/doctors">
          <a className={`flex flex-col items-center ${location.startsWith("/doctors") ? "text-primary" : "text-slate-400"}`}>
            <i className="fas fa-user-md text-xl"></i>
            <span className="text-xs mt-1">Doctors</span>
          </a>
        </Link>
        <Link href="/appointments">
          <a className={`flex flex-col items-center ${location === "/appointments" ? "text-primary" : "text-slate-400"}`}>
            <i className="fas fa-calendar-alt text-xl"></i>
            <span className="text-xs mt-1">Appointments</span>
          </a>
        </Link>
        <Link href="/profile">
          <a className={`flex flex-col items-center ${location === "/profile" ? "text-primary" : "text-slate-400"}`}>
            <i className="fas fa-user-circle text-xl"></i>
            <span className="text-xs mt-1">Profile</span>
          </a>
        </Link>
      </div>
    </nav>
  );
}
