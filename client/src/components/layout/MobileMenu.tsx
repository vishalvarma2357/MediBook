import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function MobileMenu({ isOpen, onClose, user }: MobileMenuProps) {
  const { logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex">
      <div className="bg-white w-4/5 max-w-sm h-full ml-auto flex flex-col">
        <div className="p-4 flex justify-between items-center border-b">
          <span className="text-xl font-medium">Menu</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <i className="fas fa-times text-xl"></i>
          </Button>
        </div>
        
        {user && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.imageUrl || ""} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.name}</p>
                <span className="text-sm text-primary capitalize">{user.role}</span>
              </div>
            </div>
          </div>
        )}
        
        <nav className="flex-1 overflow-y-auto">
          <Link href="/">
            <a className="flex items-center gap-3 p-4 hover:bg-slate-50 text-slate-700" onClick={onClose}>
              <i className="fas fa-home w-5 text-center text-slate-400"></i>
              <span>Home</span>
            </a>
          </Link>
          <Link href="/doctors">
            <a className="flex items-center gap-3 p-4 hover:bg-slate-50 text-slate-700" onClick={onClose}>
              <i className="fas fa-user-md w-5 text-center text-slate-400"></i>
              <span>Doctors</span>
            </a>
          </Link>
          <Link href="/appointments">
            <a className="flex items-center gap-3 p-4 hover:bg-slate-50 text-slate-700" onClick={onClose}>
              <i className="fas fa-calendar-alt w-5 text-center text-slate-400"></i>
              <span>Appointments</span>
            </a>
          </Link>
          <Link href="/profile">
            <a className="flex items-center gap-3 p-4 hover:bg-slate-50 text-slate-700" onClick={onClose}>
              <i className="fas fa-user-circle w-5 text-center text-slate-400"></i>
              <span>My Profile</span>
            </a>
          </Link>
          {user?.role === "admin" && (
            <Link href="/admin">
              <a className="flex items-center gap-3 p-4 hover:bg-slate-50 text-slate-700" onClick={onClose}>
                <i className="fas fa-shield-alt w-5 text-center text-slate-400"></i>
                <span>Admin Dashboard</span>
              </a>
            </Link>
          )}
        </nav>
        
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-red-600 w-full"
          >
            <i className="fas fa-sign-out-alt w-5 text-center"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
