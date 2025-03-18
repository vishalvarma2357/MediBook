import { DoctorWithUser } from "@shared/schema";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface DoctorCardProps {
  doctor: DoctorWithUser;
  compact?: boolean;
}

export default function DoctorCard({ doctor, compact = false }: DoctorCardProps) {
  const [, setLocation] = useLocation();

  const handleViewProfile = () => {
    setLocation(`/doctors/${doctor.id}`);
  };

  const handleBookAppointment = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocation(`/doctors/${doctor.id}?book=true`);
  };

  const getRatingStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={`full-${i}`} className="fas fa-star text-yellow-400 text-xs"></i>);
    }
    
    if (hasHalfStar) {
      stars.push(<i key="half" className="fas fa-star-half-alt text-yellow-400 text-xs"></i>);
    }
    
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<i key={`empty-${i}`} className="far fa-star text-yellow-400 text-xs"></i>);
    }
    
    return stars;
  };

  if (compact) {
    return (
      <div
        onClick={handleViewProfile}
        className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full border-2 border-primary-100 flex items-center justify-center bg-primary-50 overflow-hidden">
            {doctor.user.imageUrl ? (
              <img
                src={doctor.user.imageUrl}
                alt={doctor.user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg font-semibold text-primary">
                {doctor.user.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-medium">{doctor.user.name}</h3>
            <p className="text-sm text-slate-500">{doctor.specialty}</p>
            <div className="flex items-center mt-1">
              <div className="flex">
                {getRatingStars(doctor.rating || 4.5)}
              </div>
              <span className="text-xs text-slate-500 ml-1">
                ({doctor.rating || 4.5})
              </span>
            </div>
          </div>
          <Button
            onClick={handleBookAppointment}
            className="bg-primary-100 text-primary p-2 rounded-full hover:bg-primary-200 transition-colors duration-200"
            size="icon"
            variant="ghost"
          >
            <i className="fas fa-calendar-plus"></i>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100 hover:shadow-lg transition-shadow duration-200">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full border-4 border-primary-100 flex items-center justify-center bg-primary-50 overflow-hidden">
          {doctor.user.imageUrl ? (
            <img
              src={doctor.user.imageUrl}
              alt={doctor.user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-3xl font-semibold text-primary">
              {doctor.user.name.charAt(0)}
            </span>
          )}
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-xl font-semibold">{doctor.user.name}</h3>
          <p className="text-primary mb-2">{doctor.specialty}</p>
          
          <div className="flex items-center mb-3 justify-center md:justify-start">
            <div className="flex">
              {getRatingStars(doctor.rating || 4.5)}
            </div>
            <span className="text-sm text-slate-500 ml-2">
              ({doctor.numberOfReviews || 42} reviews)
            </span>
          </div>
          
          {doctor.bio && (
            <p className="text-slate-600 text-sm mb-4 line-clamp-2">{doctor.bio}</p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Button
              onClick={handleViewProfile}
              variant="outline"
              className="flex-1"
            >
              View Profile
            </Button>
            <Button
              onClick={handleBookAppointment}
              className="flex-1"
            >
              Book Appointment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
