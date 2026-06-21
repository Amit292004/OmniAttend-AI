"use client";

import { useState } from "react";
import useSWR from "swr";
import { Star, MessageSquare, Send, UserCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import styles from "@/app/page.module.css";

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

export default function ReviewsSection() {
  const { user } = useAuth();
  const { data, error, mutate } = useSWR<{ reviews: Review[] }>('/api/reviews', fetcher, {
    refreshInterval: 5000, // Poll every 5 seconds for real-time updates
  });

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }

      setComment("");
      setRating(5);
      mutate(); // Instantly refresh reviews
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const reviews = data?.reviews || [];

  return (
    <section className="section" id="reviews" style={{ background: 'var(--bg-main)', position: 'relative', overflow: 'hidden', padding: '6rem 0' }}>
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 className={styles.headline} style={{ fontSize: "2rem", marginBottom: "1rem" }}>
            Real-Time Reviews
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", maxWidth: "600px", margin: "0 auto" }}>
            See what our users are saying about OmniAttend AI.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          {/* Reviews List */}
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '16px', 
            padding: '2rem',
            maxHeight: '600px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {error && <p style={{ color: '#ff4d4d' }}>Failed to load reviews.</p>}
            {!data && !error && <p style={{ color: 'rgba(255,255,255,0.5)' }}>Loading reviews...</p>}
            {reviews.length === 0 && data && (
              <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: '2rem' }}>
                No reviews yet. Be the first to leave one!
              </p>
            )}

            {reviews.map((review) => (
              <div key={review.id} style={{ 
                background: 'rgba(0,0,0,0.3)', 
                padding: '1.5rem', 
                borderRadius: '12px',
                borderLeft: '4px solid #f72585'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <UserCircle2 size={20} color="rgba(255,255,255,0.6)" />
                  <strong style={{ color: '#fff', fontSize: '0.95rem' }}>
                    {review.user.firstName ? `${review.user.firstName} ${review.user.lastName || ''}` : review.user.email.split('@')[0]}
                  </strong>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginLeft: 'auto' }}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '0.75rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      size={14} 
                      fill={star <= review.rating ? "#ffd166" : "transparent"} 
                      color={star <= review.rating ? "#ffd166" : "rgba(255,255,255,0.2)"} 
                    />
                  ))}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
                  {review.comment}
                </p>
              </div>
            ))}
          </div>

          {/* Submit Review Form */}
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '16px', 
            padding: '2rem',
            height: 'fit-content'
          }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={20} color="#4cc9f0" /> Leave a Review
            </h3>

            {user ? (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {submitError && (
                  <div style={{ background: 'rgba(255, 77, 77, 0.1)', border: '1px solid #ff4d4d', color: '#ff4d4d', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                    {submitError}
                  </div>
                )}
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>Rating</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        style={{ 
                          background: 'transparent', 
                          border: 'none', 
                          cursor: 'pointer',
                          padding: '4px',
                          transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <Star 
                          size={24} 
                          fill={star <= rating ? "#ffd166" : "transparent"} 
                          color={star <= rating ? "#ffd166" : "rgba(255,255,255,0.3)"} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>Comment</label>
                  <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    placeholder="Tell us what you think..."
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '1rem',
                      fontFamily: 'inherit',
                      fontSize: '0.95rem',
                      minHeight: '120px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submitting || !comment.trim()}
                  className={styles.ctaPrimary}
                  style={{ 
                    padding: '12px', 
                    fontSize: '1rem', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    gap: '8px',
                    opacity: (submitting || !comment.trim()) ? 0.7 : 1,
                    cursor: (submitting || !comment.trim()) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? 'Submitting...' : 'Post Review'} <Send size={16} />
                </button>
              </form>
            ) : (
              <div style={{ 
                background: 'rgba(0,0,0,0.3)', 
                padding: '2rem', 
                borderRadius: '8px', 
                textAlign: 'center',
                border: '1px dashed rgba(255,255,255,0.2)'
              }}>
                <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
                  Please sign in to leave a review.
                </p>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}
                  style={{ 
                    background: 'linear-gradient(135deg, #f72585 0%, #9d4edd 100%)', 
                    border: 'none', 
                    color: '#fff', 
                    padding: '10px 24px', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
