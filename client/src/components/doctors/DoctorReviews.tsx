import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DoctorReviewsProps {
  doctorId: number;
  rating: number;
  reviewCount: number;
}

// Sample data - in a real app, this would come from an API
const sampleReviews = [
  {
    id: 1,
    patientName: "John Smith",
    rating: 5,
    date: "2023-08-15",
    comment: "Dr. Chen was very professional and knowledgeable. He took the time to explain my condition and treatment options. Highly recommended!",
    patientImage: null,
  },
  {
    id: 2,
    patientName: "Sarah Johnson",
    rating: 4,
    date: "2023-07-22",
    comment: "Very good experience. The doctor was attentive and explained everything clearly. The only downside was the waiting time.",
    patientImage: null,
  },
  {
    id: 3,
    patientName: "Michael Brown",
    rating: 5,
    date: "2023-06-10",
    comment: "Excellent doctor! Very caring and thorough. Made me feel comfortable and answered all my questions.",
    patientImage: null,
  }
];

export default function DoctorReviews({ doctorId, rating, reviewCount }: DoctorReviewsProps) {
  // This would be replaced with actual API data in a production app
  const reviews = sampleReviews;
  
  // Rating breakdown calculation (for display purposes)
  const ratingBreakdown = {
    5: Math.round((reviewCount * 0.7)),
    4: Math.round((reviewCount * 0.2)),
    3: Math.round((reviewCount * 0.05)),
    2: Math.round((reviewCount * 0.03)),
    1: Math.round((reviewCount * 0.02)),
  };
  
  // Ensure the sum matches the total review count
  let sum = Object.values(ratingBreakdown).reduce((a, b) => a + b, 0);
  if (sum !== reviewCount) {
    ratingBreakdown[5] += (reviewCount - sum);
  }

  // Get percentage for each rating
  const getPercentage = (count: number) => {
    return reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Overall Rating Card */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Overall Rating</h3>
            <div className="flex items-center mb-4">
              <div className="text-4xl font-bold mr-4">{rating.toFixed(1)}</div>
              <div>
                <div className="flex mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.floor(rating) 
                          ? "text-yellow-400 fill-yellow-400" 
                          : star - 0.5 <= rating 
                          ? "text-yellow-400 fill-yellow-400" 
                          : "text-yellow-400"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-slate-500">Based on {reviewCount} reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Rating Breakdown Card */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Rating Breakdown</h3>
            {[5, 4, 3, 2, 1].map((rate) => (
              <div key={rate} className="flex items-center mb-2">
                <div className="w-10 text-sm font-medium">{rate} stars</div>
                <div className="flex-1 mx-3">
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div 
                      className="h-full bg-primary"
                      style={{ width: `${getPercentage(ratingBreakdown[rate as keyof typeof ratingBreakdown])}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-10 text-sm text-right text-slate-500">
                  {getPercentage(ratingBreakdown[rate as keyof typeof ratingBreakdown])}%
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      
      {/* Reviews Section */}
      <div>
        <h3 className="text-lg font-medium mb-4">Patient Reviews</h3>
        
        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                        {review.patientImage ? (
                          <img 
                            src={review.patientImage} 
                            alt={review.patientName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-primary font-medium">
                            {review.patientName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{review.patientName}</p>
                        <p className="text-sm text-slate-500">{review.date}</p>
                      </div>
                    </div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating 
                              ? "text-yellow-400 fill-yellow-400" 
                              : "text-yellow-400"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 text-slate-600">{review.comment}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-5xl mb-4 text-slate-300">
                  <i className="far fa-comment-dots"></i>
                </div>
                <h3 className="text-lg font-medium mb-2">No Reviews Yet</h3>
                <p className="text-slate-500">
                  This doctor hasn't received any reviews yet.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
