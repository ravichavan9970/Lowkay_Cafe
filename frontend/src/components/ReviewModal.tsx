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
            className="p-1 text-stone-300 hover:text-amber-400 transition-colors"
          >
            <Star
              className={`w-6 h-6 ${
                star <= val ? 'text-amber-400 fill-amber-400' : 'text-stone-200'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-stone-900 animate-in zoom-in-95 duration-200">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="font-display font-extrabold text-xl text-stone-950">
              Thank You!
            </h3>
            <p className="text-xs text-stone-500">
              Your feedback helps Lowkey Cafe craft ever better artisan experiences.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2">
                <Heart className="w-6 h-6 fill-amber-500" />
              </div>
              <h3 className="font-display font-extrabold text-lg text-stone-950">
                Rate Your Experience
              </h3>
              <p className="text-xs text-stone-500">Order Ref: {orderCode}</p>
            </div>

            <div className="space-y-3.5 mb-5 bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">Overall Rating</span>
                {renderStarSelector(overallRating, setOverallRating)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">Food Quality</span>
                {renderStarSelector(foodRating, setFoodRating)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">Service</span>
                {renderStarSelector(serviceRating, setServiceRating)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">Cleanliness</span>
                {renderStarSelector(cleanlinessRating, setCleanlinessRating)}
              </div>
            </div>

            <div className="mb-5">
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Your Thoughts (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="What did you love? Any dishes you recommend?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-stone-200 focus:outline-none focus:border-brand-500 resize-none"
              ></textarea>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-stone-900 to-stone-800 hover:from-brand-600 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Review...</span>
                </>
              ) : (
                <>
                  <Star className="w-4 h-4" />
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
