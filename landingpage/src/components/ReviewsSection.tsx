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
    <section className={styles.section} id="reviews" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ textAlign: "center", marginBottom: "4rem" }}>
        <div className={styles.eyebrow} style={{ color: 'var(--accent)' }}>Wall of Love</div>
        <h2 className={styles.sectionTitle}>
          Real-Time Reviews
        </h2>
        <p className={styles.sectionSub}>
          See what educators and administrators are saying about OmniAttend AI.
        </p>
      </div>

      <div className="bento-grid">
        {/* Reviews List */}
        <div className="bento-item-large" style={{ 
          background: 'var(--surface-card)', 
          border: '1px solid var(--surface-border)', 
          borderRadius: '20px', 
          padding: '2rem',
          maxHeight: '620px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-md)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }}>
          {error && <p style={{ color: '#ff4d4d', textAlign: 'center' }}>Failed to load reviews.</p>}
          {!data && !error && <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Loading reviews...</p>}
          {reviews.length === 0 && data && (
            <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: '4rem' }}>
              No reviews yet. Be the first to leave one!
            </p>
          )}

          {reviews.map((review) => (
            <div key={review.id} style={{ 
              background: 'rgba(0, 0, 0, 0.25)', 
              padding: '1.5rem', 
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.03)',
              borderLeft: '4px solid var(--accent)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.borderLeftColor = 'var(--accent)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.borderLeftColor = 'var(--accent)';
              e.currentTarget.style.transform = 'translateY(0px)';
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <UserCircle2 size={18} color="var(--accent)" />
                <strong style={{ color: '#fff', fontSize: '0.92rem', fontWeight: 600 }}>
                  {review.user.firstName ? `${review.user.firstName} ${review.user.lastName || ''}` : review.user.email.split('@')[0]}
                </strong>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', marginLeft: 'auto' }}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '0.75rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    size={13} 
                    fill={star <= review.rating ? "#ffd166" : "transparent"} 
                    color={star <= review.rating ? "#ffd166" : "rgba(255,255,255,0.15)"} 
                  />
                ))}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                {review.comment}
              </p>
            </div>
          ))}
        </div>

        {/* Submit Review Form */}
        <div style={{ 
          background: 'var(--surface-card)', 
          border: '1px solid var(--surface-border)', 
          borderRadius: '20px', 
          padding: '2.2rem',
          height: 'fit-content',
          boxShadow: 'var(--shadow-md)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
            <MessageSquare size={20} color="var(--secondary)" /> Leave a Review
          </h3>

          {user ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {submitError && (
                <div style={{ background: 'rgba(247, 37, 133, 0.08)', border: '1px solid rgba(247, 37, 133, 0.2)', color: 'var(--accent)', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem' }}>
                  {submitError}
                </div>
              )}
              
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rating</label>
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
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Star 
                        size={26} 
                        fill={star <= rating ? "#ffd166" : "transparent"} 
                        color={star <= rating ? "#ffd166" : "rgba(255,255,255,0.25)"} 
                        style={{ filter: star <= rating ? 'drop-shadow(0 0 4px rgba(255,209,102,0.4))' : 'none' }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Comment</label>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  placeholder="Share your experience using OmniAttend AI..."
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    color: '#fff',
                    padding: '1rem',
                    fontFamily: 'inherit',
                    fontSize: '0.95rem',
                    minHeight: '130px',
                    resize: 'none',
                    outline: 'none',
                    transition: 'all 0.25s ease'
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'rgba(157, 78, 221, 0.4)';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(157, 78, 221, 0.1)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting || !comment.trim()}
                className="btn-primary"
                style={{ 
                  padding: '14px', 
                  fontSize: '0.95rem', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  gap: '8px',
                  width: '100%',
                  opacity: (submitting || !comment.trim()) ? 0.6 : 1,
                  cursor: (submitting || !comment.trim()) ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Posting...' : 'Post Review'} <Send size={16} />
              </button>
            </form>
          ) : (
            <div style={{ 
              background: 'rgba(0,0,0,0.25)', 
              padding: '2.5rem 1.5rem', 
              borderRadius: '12px', 
              textAlign: 'center',
              border: '1px dashed rgba(255,255,255,0.1)'
            }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem', fontSize: '0.92rem', lineHeight: 1.6 }}>
                Please sign in to join the discussion and share your experience with other educators.
              </p>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}
                className="btn-primary"
                style={{ 
                  padding: '10px 24px', 
                  fontSize: '0.9rem'
                }}
              >
                Sign In to Review
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
