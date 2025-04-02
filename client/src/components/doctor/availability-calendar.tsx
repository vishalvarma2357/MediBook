import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar as CalendarIcon, Trash2, Plus } from "lucide-react";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAvailabilitySlotSchema } from "@shared/schema";
import { z } from "zod";

// Extending the schema to include field validation and slot duration
const timeSlotSchema = insertAvailabilitySlotSchema.extend({
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  duration: z.number().min(15, "Minimum duration is 15 minutes").max(120, "Maximum duration is 2 hours"),
  isBooked: z.boolean().optional(),
});

type TimeSlotFormValues = z.infer<typeof timeSlotSchema>;

export default function AvailabilityCalendar() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddSlotDialogOpen, setIsAddSlotDialogOpen] = useState(false);

  // Format selected date for API queries
  const formattedDate = selectedDate ? selectedDate.toISOString().split('T')[0] : '';

  // Get doctor's availability for selected date
  const { data: availabilitySlots, isLoading: slotsLoading } = useQuery({
    queryKey: ["/api/doctors/availability", user?.doctorProfile?.id, formattedDate],
    queryFn: async () => {
      const res = await fetch(`/api/doctors/${user?.doctorProfile?.id}/availability?date=${formattedDate}`);
      if (!res.ok) throw new Error("Failed to fetch availability");
      return res.json();
    },
    enabled: !!user?.doctorProfile?.id && !!formattedDate,
  });

  // Form for adding new availability slot
  const form = useForm<TimeSlotFormValues>({
    resolver: zodResolver(timeSlotSchema),
    defaultValues: {
      date: formattedDate,
      startTime: "09:00",
      endTime: "09:30",
      duration: 30,
    },
  });

  // Update form default date when selected date changes
  useEffect(() => {
    form.setValue("date", formattedDate);
  }, [formattedDate, form]);

  // Add availability slot mutation
  const addSlotMutation = useMutation({
    mutationFn: async (data: TimeSlotFormValues) => {
      return apiRequest("POST", "/api/availability", data);
    },
    onSuccess: () => {
      toast({
        title: "Availability added",
        description: "Your availability slot has been successfully added.",
      });
      setIsAddSlotDialogOpen(false);
      queryClient.invalidateQueries({ 
        queryKey: ["/api/doctors/availability", user?.doctorProfile?.id] 
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error adding availability",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Delete availability slot mutation
  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: number) => {
      return apiRequest("DELETE", `/api/availability/${slotId}`);
    },
    onSuccess: () => {
      toast({
        title: "Availability removed",
        description: "Your availability slot has been successfully removed.",
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/doctors/availability", user?.doctorProfile?.id] 
      });
    },
    onError: (error) => {
      toast({
        title: "Error removing availability",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Handle form submission for adding new slot
  const onSubmit = (values: TimeSlotFormValues) => {
    addSlotMutation.mutate(values);
  };

  // Generate time options for select dropdowns
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, "0");
        const formattedMinute = minute.toString().padStart(2, "0");
        options.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Calculate end time based on start time and duration
  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    const endHours = endDate.getHours().toString().padStart(2, "0");
    const endMinutes = endDate.getMinutes().toString().padStart(2, "0");
    return `${endHours}:${endMinutes}`;
  };

  // Update end time when start time or duration changes
  useEffect(() => {
    const startTime = form.watch("startTime");
    const duration = form.watch("duration");
    
    if (startTime && duration) {
      const endTime = calculateEndTime(startTime, duration);
      form.setValue("endTime", endTime);
    }
  }, [form.watch("startTime"), form.watch("duration")]);

  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-neutral-800">Manage Your Availability</h2>
        <Button 
          className="flex items-center gap-2" 
          onClick={() => setIsAddSlotDialogOpen(true)}
        >
          <Plus className="h-4 w-4" /> Add Availability
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Date selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
            <CardDescription>Choose a date to view or add availability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? formatDate(selectedDate.toISOString().split('T')[0]) : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Availability slots */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Available Time Slots</CardTitle>
            <CardDescription>Your available appointment slots for {selectedDate ? formatDate(formattedDate) : "selected date"}</CardDescription>
          </CardHeader>
          <CardContent>
            {slotsLoading ? (
              <div className="flex items-center justify-center p-6">
                <p className="text-neutral-600">Loading availability...</p>
              </div>
            ) : !availabilitySlots || availabilitySlots.length === 0 ? (
              <div className="bg-neutral-50 rounded-lg p-6 text-center">
                <p className="text-neutral-600 mb-2">No availability set for this date.</p>
                <Button 
                  variant="outline" 
                  className="mx-auto" 
                  onClick={() => setIsAddSlotDialogOpen(true)}
                >
                  Add Availability
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availabilitySlots.map((slot: any) => (
                  <div 
                    key={slot.id} 
                    className={cn(
                      "p-3 border rounded-lg relative group",
                      slot.isBooked ? "bg-neutral-100 border-neutral-200" : "border-neutral-200"
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{formatTime(slot.startTime)}</span>
                      {!slot.isBooked && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteSlotMutation.mutate(slot.id)}
                        >
                          <Trash2 className="h-4 w-4 text-neutral-500 hover:text-red-500" />
                        </Button>
                      )}
                    </div>
                    <div className="text-sm text-neutral-600">
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </div>
                    {slot.isBooked ? (
                      <Badge variant="secondary" className="mt-1">Booked</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mt-1">Available</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Availability Dialog */}
      <Dialog open={isAddSlotDialogOpen} onOpenChange={setIsAddSlotDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Availability</DialogTitle>
            <DialogDescription>
              Create availability slots for patients to book appointments.
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
                      <div className="flex items-center">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? formatDate(field.value) : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  field.onChange(date.toISOString().split('T')[0]);
                                }
                              }}
                              initialFocus
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select start time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(parseInt(val))}
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
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <div className="h-10 px-3 py-2 rounded-md border border-neutral-200 text-neutral-800 bg-neutral-100">
                        {field.value || "Calculated end time"}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddSlotDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addSlotMutation.isPending}>
                  {addSlotMutation.isPending ? "Adding..." : "Add Slot"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}