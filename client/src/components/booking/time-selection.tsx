import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon 
} from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TimeSelectionProps {
  doctorId: number;
  onContinue: (slotId: number, date: string, startTime: string, endTime: string) => void;
  onBack: () => void;
}

export default function TimeSelection({ doctorId, onContinue, onBack }: TimeSelectionProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<{
    startTime: string;
    endTime: string;
  } | null>(null);
  
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Query to fetch doctor's available slots
  const { data: availableSlots, isLoading } = useQuery({
    queryKey: [`/api/doctors/${doctorId}/availability`, selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/doctors/${doctorId}/availability?date=${selectedDate}`);
      if (!res.ok) throw new Error("Failed to fetch availability");
      return res.json();
    },
    staleTime: 60000, // 1 minute
  });

  // Reset selected slot when date changes
  useEffect(() => {
    setSelectedSlot(null);
    setSelectedTimes(null);
  }, [selectedDate]);

  // Handle date navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  // Format month for display
  const formattedMonth = currentMonth.toLocaleString('default', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Total days in month
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    // Generate array with days from previous month to fill the first week
    const daysWithPadding = [];
    
    // Add previous month days
    const prevMonth = new Date(year, month, 0);
    const prevMonthLastDay = prevMonth.getDate();
    
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      daysWithPadding.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
        isPast: new Date(year, month - 1, prevMonthLastDay - i) < new Date(new Date().setHours(0, 0, 0, 0))
      });
    }
    
    // Add current month days
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      daysWithPadding.push({
        date,
        isCurrentMonth: true,
        isPast: date < new Date(new Date().setHours(0, 0, 0, 0))
      });
    }
    
    // Add next month days to complete the last week
    const remainingCells = 7 - (daysWithPadding.length % 7 || 7);
    
    for (let i = 1; i <= remainingCells; i++) {
      daysWithPadding.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        isPast: false // Next month days are never in the past
      });
    }
    
    // Group days by weeks
    const weeks = [];
    for (let i = 0; i < daysWithPadding.length; i += 7) {
      weeks.push(daysWithPadding.slice(i, i + 7));
    }
    
    return weeks;
  };

  const calendarWeeks = generateCalendarDays();

  const handleDateSelect = (date: Date) => {
    const formattedDate = date.toISOString().split('T')[0];
    setSelectedDate(formattedDate);
  };

  const handleSlotSelect = (slot: any) => {
    setSelectedSlot(slot.id);
    setSelectedTimes({
      startTime: slot.startTime,
      endTime: slot.endTime
    });
  };

  const handleContinue = () => {
    if (selectedSlot && selectedTimes && selectedDate) {
      onContinue(selectedSlot, selectedDate, selectedTimes.startTime, selectedTimes.endTime);
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Select Appointment Date & Time</h3>
        <div className="animate-pulse">
          <div className="h-64 bg-neutral-100 rounded-xl mb-6"></div>
          <div className="h-6 bg-neutral-100 rounded w-64 mb-3"></div>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-12 bg-neutral-100 rounded"></div>
            ))}
          </div>
          <div className="flex gap-4">
            <div className="h-10 bg-neutral-100 rounded flex-1"></div>
            <div className="h-10 bg-neutral-100 rounded flex-1"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-neutral-800 mb-4">Select Appointment Date & Time</h3>
      
      <div className="mb-6">
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="bg-neutral-100 p-4">
            <div className="flex justify-between items-center">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h4 className="font-medium text-neutral-800">{formattedMonth}</h4>
              <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-neutral-500 text-sm py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {calendarWeeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-2">
                {week.map((day, dayIndex) => {
                  const dateString = day.date.toISOString().split('T')[0];
                  const isSelectedDate = dateString === selectedDate;
                  
                  return (
                    <div key={dayIndex} className="text-center">
                      <button
                        className={cn(
                          "w-full py-3 rounded-lg font-medium",
                          day.isPast ? "text-neutral-400 cursor-not-allowed" : "hover:bg-neutral-100",
                          !day.isCurrentMonth && "text-neutral-400 opacity-50",
                          isSelectedDate && "bg-primary text-white hover:bg-primary",
                          isToday(day.date) && !isSelectedDate && "border border-primary text-primary"
                        )}
                        disabled={day.isPast}
                        onClick={() => !day.isPast && handleDateSelect(day.date)}
                      >
                        {day.date.getDate()}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <h4 className="font-medium text-neutral-800 mb-3">
        Available Time Slots for {formatDate(selectedDate)}
      </h4>
      
      {availableSlots && availableSlots.length > 0 ? (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-6">
          {availableSlots.map(slot => (
            <button
              key={slot.id}
              className={cn(
                "p-3 border rounded-lg text-center",
                selectedSlot === slot.id 
                  ? "border-primary-500 bg-primary-50 text-primary-500 font-medium" 
                  : "border-primary-100 hover:bg-primary-50 text-neutral-800"
              )}
              onClick={() => handleSlotSelect(slot)}
            >
              {formatTime(slot.startTime)}
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-neutral-100 rounded-lg p-6 text-center mb-6">
          <p className="text-neutral-600">No available slots for this date.</p>
          <Badge variant="outline" className="mt-2">
            Try another date
          </Badge>
        </div>
      )}
      
      <div className="flex gap-4">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button 
          className="flex-1" 
          onClick={handleContinue}
          disabled={!selectedSlot}
        >
          Continue to Confirm
        </Button>
      </div>
    </div>
  );
}
