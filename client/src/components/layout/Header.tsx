import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings, User as UserIcon, CalendarClock, LogOut, ChevronDown } from "lucide-react";
import MobileMenu from "./MobileMenu";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm py-4 sticky top-0 z-40">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <i className="fas fa-heartbeat text-primary text-2xl"></i>
          <Link href="/">
            <span className="font-bold text-primary text-xl cursor-pointer">MediBook</span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/">
            <a className="text-slate-600 hover:text-primary font-medium">Home</a>
          </Link>
          <Link href="/doctors">
            <a className="text-slate-600 hover:text-primary font-medium">Doctors</a>
          </Link>
          <Link href="/appointments">
            <a className="text-slate-600 hover:text-primary font-medium">Appointments</a>
          </Link>
          {user?.role === "admin" && (
            <Link href="/admin">
              <a className="text-slate-600 hover:text-primary font-medium">Admin</a>
            </Link>
          )}
        </nav>
        
        {/* User Menu */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-blue-100 text-primary-700 text-sm capitalize">
                {user.role}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.imageUrl || ""} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{user.name}</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/appointments">
                    <DropdownMenuItem className="cursor-pointer">
                      <CalendarClock className="mr-2 h-4 w-4" />
                      <span>My Appointments</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={toggleMobileMenu}
            >
              <i className="fas fa-bars text-xl"></i>
            </Button>
          </div>
        )}
      </div>
      
      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={toggleMobileMenu} user={user} />
    </header>
  );
}
