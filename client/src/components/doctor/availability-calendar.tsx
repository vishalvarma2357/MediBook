import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, formatTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  Trash2 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Form schema for creating availability slots
const slotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  duration: z.number().min(15, "Duration must be at least 15 minutes").max(180, "Duration must be less than 3 hours")
}).refine(data => data.startTime < data.endTime, {
  message: "End time must be after start time",
  path: ["endTime"]
});

type SlotFormValues = z.infer<typeof slotSchema>;

export default function AvailabilityCalendar() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get user's doctor profile ID
  const doctorProfileId = user?.doctorProfile?.id;

  // Query to fetch doctor's availability slots
  const { data: slots, isLoading } = useQuery({
    queryKey: ["/api/availability", doctorProfileId],
    queryFn: async () => {
      if (!doctorProfileId) return [];
      const res = await fetch(`/api/doctors/${doctorProfileId}/availability`);
      if (!res.ok) throw new Error("Failed to fetch availability");
      return res.json();
    },
    enabled: !!doctorProfileId,
    staleTime: 60000, // 1 minute
  });

  // Create slot mutation
  const createSlotMutation = useMutation({
    mutationFn: async (data: SlotFormValues) => {
      return apiRequest("POST", "/api/availability", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      toast({
        title: "Success",
        description: "Availability slot has been created",
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create availability: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete slot mutation
  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: number) => {
      return apiRequest("DELETE", `/api/availability/${slotId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      toast({
        title: "Success",
        description: "Availability slot has been removed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete availability: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const form = useForm<SlotFormValues>({
    resolver: zodResolver(slotSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      startTime: "09:00",
      endTime: "09:30",
      duration: 30
    },
  });

  function onSubmit(values: SlotFormValues) {
    createSlotMutation.mutate(values);
  }

  // Navigation functions for calendar
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

  // Group slots by day
  const slotsByDay = {};
  if (slots) {
    slots.forEach(slot => {
      if (!slotsByDay[slot.date]) {
        slotsByDay[slot.date] = [];
      }
      slotsByDay[slot.date].push(slot);
    });
  }

  // Get dates for the month
  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const monthDays = getDaysInMonth(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );

  // Calculate the day of week for the first day of the month (0-6)
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  // Create array with empty cells for the days before the first day of month
  const calendarDays = [...Array(firstDayOfMonth).fill(null), ...monthDays];

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-8 bg-neutral-100 rounded mb-4 w-32"></div>
          <div className="grid grid-cols-7 gap-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-40 bg-neutral-100 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-neutral-800">Manage Availability</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" /> Add Time Slots
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Availability Slot</DialogTitle>
              <DialogDescription>
                Set your available time for patient appointments.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Appointment Duration (minutes)</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        This will determine how many appointment slots will be created
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={createSlotMutation.isPending}>
                    {createSlotMutation.isPending ? "Creating..." : "Create Slot"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden mb-6">
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
          </div>

          <div className="grid grid-cols-7 gap-4">
            {/* Day headers */}
            {days.map(day => (
              <div key={day} className="text-center text-neutral-600 font-medium mb-2">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((day, index) => {
              if (!day) {
                // Empty cell for days before the start of the month
                return <div key={`empty-${index}`} className="text-center opacity-30"></div>;
              }

              const dateStr = day.toISOString().split('T')[0];
              const isToday = new Date().toISOString().split('T')[0] === dateStr;
              const daySlots = slotsByDay[dateStr] || [];
              
              return (
                <div 
                  key={dateStr} 
                  className={`text-center ${isToday ? 'bg-primary-50 border-primary-100' : 'bg-neutral-50'} rounded-lg p-3`}
                >
                  <p className={`font-medium ${isToday ? 'text-primary' : 'text-neutral-600'} mb-2`}>
                    {day.getDate()}
                  </p>
                  <div className="space-y-2">
                    {daySlots.map(slot => (
                      <div 
                        key={slot.id} 
                        className={`bg-white rounded-lg p-2 border ${slot.isBooked ? 'border-neutral-200 text-neutral-400' : 'border-primary-100'} text-left text-sm`}
                      >
                        <div className="flex justify-between items-center">
                          <p className="font-medium">{formatTime(slot.startTime)}</p>
                          {!slot.isBooked && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-5 w-5 -mr-1" 
                              onClick={() => deleteSlotMutation.mutate(slot.id)}
                            >
                              <Trash2 className="h-3 w-3 text-neutral-400 hover:text-red-500" />
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500">{slot.duration} min{slot.isBooked ? ' (Booked)' : ''}</p>
                      </div>
                    ))}
                    {daySlots.length === 0 && (
                      <p className="text-xs text-neutral-400">No slots</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
