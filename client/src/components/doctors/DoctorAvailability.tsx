import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { TimeSlot } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { parse, format, isValid } from "date-fns";

interface DoctorAvailabilityProps {
  doctorId: number;
  timeSlots: TimeSlot[];
  isLoading: boolean;
  onBookAppointment: () => void;
}

export default function DoctorAvailability({ 
  doctorId, 
  timeSlots, 
  isLoading, 
  onBookAppointment 
}: DoctorAvailabilityProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  // Convert date string to date object
  const dateStringToDate = (dateString: string) => {
    const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
    return isValid(parsedDate) ? parsedDate : undefined;
  };
  
  // Get unique dates from time slots
  const uniqueDates = [...new Set(timeSlots.map(slot => slot.date))];
  
  // Create an array of available dates
  const availableDates = uniqueDates
    .map(dateStr => dateStringToDate(dateStr))
    .filter(Boolean) as Date[];
  
  // Group time slots by date
  const timeSlotsByDate = timeSlots.reduce<Record<string, TimeSlot[]>>((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {});
  
  // Get time slots for selected date
  const selectedDateFormatted = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const slotsForSelectedDate = timeSlotsByDate[selectedDateFormatted] || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="text-5xl mb-4 text-slate-300">
            <i className="far fa-calendar-times"></i>
          </div>
          <h3 className="text-lg font-medium mb-2">No Available Time Slots</h3>
          <p className="text-slate-500 mb-4">
            This doctor currently has no available time slots. Please check back later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Select a Date</h3>
        <div className="border rounded-md p-4 bg-white">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => {
              return !availableDates.some(
                availableDate => 
                  availableDate.getDate() === date.getDate() &&
                  availableDate.getMonth() === date.getMonth() &&
                  availableDate.getFullYear() === date.getFullYear()
              );
            }}
            className="mx-auto"
          />
        </div>
      </div>
      
      {selectedDate && slotsForSelectedDate.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Available Time Slots</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {slotsForSelectedDate.map((slot) => (
              <Button
                key={slot.id}
                variant="outline"
                className="py-6"
                onClick={onBookAppointment}
              >
                <i className="far fa-clock mr-2"></i>
                {slot.startTime} - {slot.endTime}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {selectedDate && slotsForSelectedDate.length === 0 && (
        <div className="text-center py-4">
          <p className="text-slate-500">No time slots available for the selected date.</p>
        </div>
      )}
      
      {!selectedDate && (
        <div className="text-center py-4 text-slate-500">
          <p>Please select a date to view available time slots.</p>
        </div>
      )}
    </div>
  );
}
