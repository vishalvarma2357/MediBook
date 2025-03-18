import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DoctorWithUser, TimeSlot, insertAppointmentSchema } from "@shared/schema";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format, parse, isValid } from "date-fns";

interface BookingFormProps {
  doctor: DoctorWithUser;
  timeSlots: TimeSlot[];
  isLoading: boolean;
  onCancel: () => void;
}

export default function BookingForm({ doctor, timeSlots, isLoading, onCancel }: BookingFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  // Get unique dates from time slots
  const uniqueDates = [...new Set(timeSlots.map(slot => slot.date))];
  
  // Group time slots by date
  const timeSlotsByDate = timeSlots.reduce<Record<string, TimeSlot[]>>((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {});

  // Filter time slots for selected date
  const availableTimeSlots = selectedDate && isValid(selectedDate) 
    ? timeSlotsByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  // Form schema
  const formSchema = z.object({
    timeSlotId: z.string().min(1, "Please select a time slot"),
    notes: z.string().optional(),
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      timeSlotId: "",
      notes: "",
    },
  });

  // Booking mutation
  const bookingMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const timeSlotId = parseInt(values.timeSlotId);
      
      if (!user || !timeSlotId) {
        throw new Error("Missing required data for booking");
      }
      
      const appointmentData = {
        patientId: user.id,
        doctorId: doctor.id,
        timeSlotId: timeSlotId,
        notes: values.notes || "",
        status: "pending",
      };
      
      const res = await apiRequest("POST", "/api/appointments", appointmentData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: [`/api/doctors/${doctor.id}/timeslots`] });
      
      toast({
        title: "Appointment Booked",
        description: `Your appointment with ${doctor.user.name} has been booked successfully.`,
      });
      
      navigate("/appointments");
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    bookingMutation.mutate(values);
  };

  // Convert date string to date object
  const dateStringToDate = (dateString: string) => {
    const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
    return isValid(parsedDate) ? parsedDate : undefined;
  };

  // Create an array of available dates from unique dates
  const availableDates = uniqueDates.map(dateStr => dateStringToDate(dateStr)).filter(Boolean) as Date[];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book an Appointment</CardTitle>
        <CardDescription>
          Schedule an appointment with {doctor.user.name}, {doctor.specialty}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : timeSlots.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4 text-slate-300">
              <i className="far fa-calendar-times"></i>
            </div>
            <h3 className="text-lg font-medium mb-2">No Available Time Slots</h3>
            <p className="text-slate-500">
              This doctor currently has no available time slots. Please check back later or contact directly.
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Select a Date</h3>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, 'PPP')
                        ) : (
                          <span>Select a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
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
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <FormField
                  control={form.control}
                  name="timeSlotId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select a Time</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedDate || availableTimeSlots.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a time slot" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableTimeSlots.map((slot) => (
                            <SelectItem key={slot.id} value={slot.id.toString()}>
                              {slot.startTime} - {slot.endTime}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Available time slots for the selected date
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any special notes or reason for the visit"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Any information that might be helpful for the doctor
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={form.handleSubmit(onSubmit)}
          disabled={isLoading || bookingMutation.isPending || timeSlots.length === 0}
        >
          {bookingMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Booking...
            </>
          ) : (
            "Book Appointment"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
