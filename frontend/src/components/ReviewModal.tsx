import React, { useState } from 'react';
import { reviewApi } from '../services/api';
import confetti from 'canvas-confetti';
import { X, Star, Heart, MessageSquare, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface ReviewModalProps {
  orderCode: string;
  onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ orderCode, onClose }) => {
  const [foodRating, setFoodRating] = useState(5);
  const [serviceRating, setServiceRating] = useState(5);
  const [cleanlinessRating, setCleanlinessRating] = useState(5);
  const [overallRating, setOverallRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const renderStarSelector = (val: number, setVal: (n: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setVal(star)}
            className="p-1 text-neutral-700 hover:text-yellow-400 transition-colors"
          >
            <Star
              className={`w-6 h-6 ${
                star <= val ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-700'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await reviewApi.submitReview({
        orderCode,
        foodRating,
        serviceRating,
        cleanlinessRating,
        overallRating,
        comment: comment.trim() || undefined,
      });

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });

      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Review submitted or already recorded.');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-white animate-in zoom-in-95 duration-200">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 flex items-center justify-center mx-auto animate-bounce">
              <Sparkles className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h3 className="font-display font-extrabold text-xl text-white">
              Thank You!
            </h3>
            <p className="text-xs text-neutral-400">
              Your feedback helps Lowkey Cafe craft ever better artisan experiences.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 flex items-center justify-center mx-auto mb-2">
                <Heart className="w-6 h-6 fill-yellow-400 stroke-[2]" />
              </div>
              <h3 className="font-display font-extrabold text-lg text-white">
                Rate Your Experience
              </h3>
              <p className="text-xs text-neutral-400">Order Ref: {orderCode}</p>
            </div>

            <div className="space-y-3.5 mb-5 bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300">Overall Rating</span>
                {renderStarSelector(overallRating, setOverallRating)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300">Food Quality</span>
                {renderStarSelector(foodRating, setFoodRating)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300">Service</span>
                {renderStarSelector(serviceRating, setServiceRating)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300">Cleanliness</span>
                {renderStarSelector(cleanlinessRating, setCleanlinessRating)}
              </div>
            </div>

            <div className="mb-5">
              <label className="text-xs font-bold text-neutral-300 block mb-1">
                Your Thoughts (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="What did you love? Any dishes you recommend?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-400 resize-none transition-colors"
              ></textarea>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20 transition-all active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Submitting Review...</span>
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 fill-black stroke-black" />
                  <span>Submit Rating</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewModal;
