import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatter - converts YYYY-MM-DD to more readable format
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', options);
}

// Time formatter - converts 24-hour format (HH:MM) to 12-hour format
export function formatTime(timeString: string): string {
  if (!timeString) return '';
  
  const [hours, minutes] = timeString.split(':').map(Number);
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Generate array of dates for a given month
export function getDatesInMonth(year: number, month: number): Date[] {
  const dates: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Add previous month dates to fill the first week
  const firstDayOfWeek = firstDay.getDay();
  for (let i = firstDayOfWeek; i > 0; i--) {
    const prevDate = new Date(year, month, 1 - i);
    dates.push(prevDate);
  }
  
  // Add current month dates
  for (let i = 1; i <= lastDay.getDate(); i++) {
    dates.push(new Date(year, month, i));
  }
  
  // Add next month dates to fill the last week
  const lastDayOfWeek = lastDay.getDay();
  for (let i = 1; i < 7 - lastDayOfWeek; i++) {
    dates.push(new Date(year, month + 1, i));
  }
  
  return dates;
}

// Format currency
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

// Generate appointment confirmation code
export function generateConfirmationCode(date: string, time: string): string {
  const cleanDate = date.replace(/-/g, '');
  const cleanTime = time.replace(':', '');
  return `APT-${cleanDate}-${cleanTime}`;
}

// Calculate age from birthdate
export function calculateAge(birthdate: string): number {
  const today = new Date();
  const birthDate = new Date(birthdate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}
