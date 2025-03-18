import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Heart, Menu, User, LogOut } from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetClose 
} from "@/components/ui/sheet";
import { useState } from "react";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Navigation links based on user role
  const getNavLinks = () => {
    if (!user) return [];

    if (user.role === UserRole.PATIENT) {
      return [
        { href: "/", label: "Home", active: location === "/" },
        { href: "/find-doctors", label: "Find Doctors", active: location === "/find-doctors" },
        { href: "/my-appointments", label: "My Appointments", active: location === "/my-appointments" },
      ];
    } 
    
    if (user.role === UserRole.DOCTOR) {
      return [
        { href: "/doctor", label: "Dashboard", active: location === "/doctor" },
      ];
    }
    
    if (user.role === UserRole.ADMIN) {
      return [
        { href: "/admin", label: "Dashboard", active: location === "/admin" },
      ];
    }
    
    return [];
  };

  const navLinks = getNavLinks();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href={user ? (user.role === UserRole.PATIENT ? "/" : `/${user.role.toLowerCase()}`) : "/auth"} className="flex items-center gap-2 text-primary font-bold text-2xl">
          <Heart className="stroke-[3px]" />
          <span>MediBook</span>
        </Link>
        
        {user && (
          <>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-neutral-600 hover:text-primary font-medium ${
                    link.active ? "text-primary" : ""
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            
            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 bg-primary-50 text-primary border-primary-100">
                      <User size={16} />
                      <span>{user.firstName} {user.lastName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem disabled>
                      Signed in as {user.username}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Mobile Menu Trigger */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <div className="flex flex-col gap-6 mt-8">
                    <div className="space-y-3">
                      {navLinks.map((link) => (
                        <SheetClose asChild key={link.href}>
                          <Link
                            href={link.href}
                            className={`block py-2 text-lg font-medium ${
                              link.active
                                ? "text-primary"
                                : "text-neutral-700"
                            }`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {link.label}
                          </Link>
                        </SheetClose>
                      ))}
                    </div>
                    <Button 
                      variant="destructive" 
                      onClick={handleLogout}
                      className="mt-4"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
