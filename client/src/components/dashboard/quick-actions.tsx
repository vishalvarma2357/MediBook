import { Link } from "wouter";
import { Calendar, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-800">Book Appointment</h3>
            <div className="bg-primary-50 p-2 rounded-full">
              <Calendar className="text-primary h-5 w-5" />
            </div>
          </div>
          <p className="text-neutral-600 text-sm mb-4">Find a doctor and book your next visit</p>
          <Button asChild className="w-full">
            <Link href="/find-doctors">Find Doctors</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-800">Upcoming Visits</h3>
            <div className="bg-green-50 p-2 rounded-full">
              <Clock className="text-green-500 h-5 w-5" />
            </div>
          </div>
          <p className="text-neutral-600 text-sm mb-4">View and manage your scheduled appointments</p>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/my-appointments">View Appointments</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-800">Medical Records</h3>
            <div className="bg-orange-50 p-2 rounded-full">
              <FileText className="text-orange-500 h-5 w-5" />
            </div>
          </div>
          <p className="text-neutral-600 text-sm mb-4">Access your medical history and documents</p>
          <Button variant="outline" className="w-full">
            View Records
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
