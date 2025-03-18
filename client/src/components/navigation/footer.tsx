import { Link } from "wouter";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl">
              <Heart className="stroke-[3px]" />
              <span>MediBook</span>
            </Link>
            <p className="text-neutral-600 text-sm mt-1">Empowering healthcare connectivity</p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            <a href="#" className="text-neutral-600 hover:text-primary text-sm">About Us</a>
            <a href="#" className="text-neutral-600 hover:text-primary text-sm">Privacy Policy</a>
            <a href="#" className="text-neutral-600 hover:text-primary text-sm">Terms of Service</a>
            <a href="#" className="text-neutral-600 hover:text-primary text-sm">Contact Support</a>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-neutral-200 text-center text-neutral-500 text-sm">
          &copy; {new Date().getFullYear()} MediBook Healthcare Booking System. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
