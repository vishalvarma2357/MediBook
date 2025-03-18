import { Link } from "wouter";
import { Check, Calendar, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime, generateConfirmationCode } from "@/lib/utils";

interface BookingSuccessProps {
  doctorName: string;
  date: string;
  startTime: string;
  confirmationCode?: string;
}

export default function BookingSuccess({
  doctorName,
  date,
  startTime,
  confirmationCode
}: BookingSuccessProps) {
  // Generate confirmation code if not provided
  const code = confirmationCode || generateConfirmationCode(date, startTime);

  return (
    <div className="text-center py-4">
      <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="text-green-500 h-8 w-8" />
      </div>
      
      <h3 className="text-xl font-bold text-neutral-800 mb-2">Appointment Confirmed!</h3>
      
      <p className="text-neutral-600 mb-6">
        Your appointment with Dr. {doctorName} has been successfully booked for{" "}
        {formatDate(date)} at {formatTime(startTime)}.
      </p>
      
      <div className="border border-neutral-200 rounded-lg p-4 mb-6 bg-neutral-50 max-w-sm mx-auto">
        <div className="text-neutral-600 text-sm mb-1">Confirmation Code</div>
        <div className="font-mono font-medium text-neutral-800 text-lg">{code}</div>
      </div>
      
      <div className="flex flex-wrap gap-4 justify-center">
        <Button variant="outline" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" /> Add to Calendar
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Printer className="h-4 w-4" /> Print Details
        </Button>
      </div>
      
      <Link href="/" className="inline-block mt-6 text-primary hover:underline font-medium">
        Return to Dashboard
      </Link>
    </div>
  );
}
