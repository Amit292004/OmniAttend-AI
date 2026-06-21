"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Mic, QrCode, Shield, Server, LayoutDashboard, Check, ChevronDown, School, Building, Users, LogOut, UserCircle2 } from "lucide-react";
import styles from "./page.module.css";
import AuthModal from "@/components/AuthModal";
import CompleteProfileModal from "@/components/CompleteProfileModal";
import { useAuth } from "@/contexts/AuthContext";
import ReviewsSection from "@/components/ReviewsSection";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [authOpen, setAuthOpen] = useState(false);
  const { user, signOut, loading } = useAuth();

  // Listen for the custom event dispatched by ReviewsSection's Sign In button
  useEffect(() => {
    const handler = () => setAuthOpen(true);
    window.addEventListener('open-auth-modal', handler);
    return () => window.removeEventListener('open-auth-modal', handler);
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.6, cubicBezier: [0.16, 1, 0.3, 1] }
  };

  const staggerContainer = {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true, margin: "-50px" },
    transition: { staggerChildren: 0.15 }
  };

  return (
    <>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <CompleteProfileModal />
      <div className="bg-orb-1" />
      <div className="bg-orb-2" />
      <div className="bg-orb-3" />

      <nav className="navbar animate-fade-in-up">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src="/img/logonew.png" alt="OmniAttend AI Logo" style={{ height: "30px" }} />
          <div className="brand-font text-gradient nav-brand-text" style={{ fontSize: '1.35rem', fontWeight: 800 }}>OmniAttend AI</div>
        </Link>
        <div className="nav-links">
          <Link href="#features">Features</Link>
          <Link href="#journey">Journey</Link>
          <Link href="#tech">Tech Stack</Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {loading ? (
            // Prevent flash of wrong buttons during auth check
            <div style={{ width: 100, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.05)' }} />
          ) : user ? (
            <>
              <span className="nav-email-text" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '4px' }}>
                <UserCircle2 size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                {user.email}
              </span>
              <Link href="http://localhost:8501/" className={styles.ctaPrimary} style={{ padding: "8px 16px", fontSize: "0.85rem", borderRadius: "8px" }}>
                Open Portal
              </Link>
              <button
                onClick={signOut}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.6)', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontFamily: 'inherit', transition: 'all 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f72585')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              >
                <LogOut size={14} /> <span className="nav-signout-text">Sign out</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setAuthOpen(true)}
                className="nav-signin-btn"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'rgba(255,255,255,0.75)', padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(157,78,221,0.5)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
              >
                Sign in
              </button>
              <button onClick={() => setAuthOpen(true)} className={styles.ctaPrimary} style={{ padding: "8px 16px", fontSize: "0.85rem", border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: '8px' }}>
                Get Started
              </button>
            </>
          )}
        </div>
      </nav>

      <header className={styles.hero}>
        <div className={styles.noise} />
        <div className={styles.beam} />

        <div className={styles.inner}>
          <motion.div 
            className={styles.liveChip}
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
          >
            <span className={styles.liveDot} />
            Welcome to the Future of Attendance
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }} style={{ marginBottom: '1rem', width: '100%' }}>
            <img src="/img/logonew.png" alt="OmniAttend Cyber Brain" className="floating" style={{ maxWidth: '440px', width: '85%', height: 'auto', display: 'block', margin: '0 auto 1.5rem' }} />
            <h1 className={`${styles.headline} ${styles.accent}`} style={{ marginBottom: 0 }}>
              AI - Powered Smart Attendance System
            </h1>
          </motion.div>
          
          <motion.p className={styles.sub} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            Revolutionizing the classroom with next-gen computer vision and voice biometrics. Trusted by educators for speed, accuracy, and absolute security.
          </motion.p>
          
          <motion.div className={styles.ctas} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
            {user ? (
              <Link href="http://localhost:8501/" className={styles.ctaPrimary}>
                Open Attendance Portal
              </Link>
            ) : (
              <button onClick={() => setAuthOpen(true)} className={styles.ctaPrimary} style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1rem' }}>
                Start AI Attendance
              </button>
            )}
            <Link href="#journey" className={styles.ctaGhost}>
              Explore Journey
            </Link>
          </motion.div>

          <motion.div className={styles.statsBar} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}>
            {[
              { label: 'Manual Roll-call Replaced', value: '100%' },
              { label: 'Biometric Methods', value: '2' },
              { label: 'Setup Time', value: '< 1 min' }
            ].map((s, i) => (
              <div key={s.label} className={styles.statCell}>
                <span className={styles.statNum}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
                {i < 2 && <div className={styles.statDivider} />}
              </div>
            ))}
          </motion.div>
        </div>
      </header>

      {/* Replaced fake Trusted By with real tech badges */}
      <section className={styles.trustedBy}>
        <div className={styles.trustedText}>Built with industry-leading open-source technology</div>
        <div className={styles.marqueeContainer}>
          <div className={styles.marquee}>
            <span className={`brand-font ${styles.companyLogo}`}>Python</span>
            <span className={`brand-font ${styles.companyLogo}`}>Streamlit</span>
            <span className={`brand-font ${styles.companyLogo}`}>face_recognition</span>
            <span className={`brand-font ${styles.companyLogo}`}>Resemblyzer</span>
            <span className={`brand-font ${styles.companyLogo}`}>Supabase</span>
            <span className={`brand-font ${styles.companyLogo}`}>Next.js</span>
            <span className={`brand-font ${styles.companyLogo}`}>PostgreSQL</span>
          </div>
          <div className={styles.marquee} aria-hidden="true">
            <span className={`brand-font ${styles.companyLogo}`}>Python</span>
            <span className={`brand-font ${styles.companyLogo}`}>Streamlit</span>
            <span className={`brand-font ${styles.companyLogo}`}>face_recognition</span>
            <span className={`brand-font ${styles.companyLogo}`}>Resemblyzer</span>
            <span className={`brand-font ${styles.companyLogo}`}>Supabase</span>
            <span className={`brand-font ${styles.companyLogo}`}>Next.js</span>
            <span className={`brand-font ${styles.companyLogo}`}>PostgreSQL</span>
          </div>
        </div>
      </section>

      <section id="features" className={styles.section}>
        <motion.div className={styles.sectionHead} {...fadeInUp}>
          <div className={styles.eyebrow}>Capabilities</div>
          <h2 className={styles.sectionTitle}>Innovative Features</h2>
          <p className={styles.sectionSub}>Everything you need to automate your classroom seamlessly.</p>
        </motion.div>
        
        <motion.div className="bento-grid" variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once: true, margin: "-50px" }}>
          {[
            { icon: <Camera size={32} strokeWidth={1.5} />, title: "AI Face Analysis", desc: "Advanced neural networks recognize every student's face from a single class photo, making attendance instant and accurate.", class: "bento-item-large" },
            { icon: <Mic size={32} strokeWidth={1.5} />, title: "Sequential Voice ID", desc: "Students say \"Present\" one-by-one, and our audio-AI matches their voice biometrics against stored embeddings in real-time." },
            { icon: <QrCode size={32} strokeWidth={1.5} />, title: "QR-Driven Roster", desc: "Course codes generate unique QR codes for instant student enrollment. No more manual entry or data management headaches." }
          ].map((feature, idx) => (
            <motion.div className={`${styles.featureCard} ${feature.class || ''}`} key={idx} variants={fadeInUp}>
              <div className={styles.fIcon}>{feature.icon}</div>
              <h3 className={styles.fTitle}>{feature.title}</h3>
              <p className={styles.fDesc}>{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <div className={styles.sep} />

      <section id="journey" className={styles.section} style={{ padding: '8rem 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
          <div className={styles.eyebrow}>Workflow</div>
          <motion.h2 className={styles.sectionTitle} {...fadeInUp}>The Teacher&apos;s Journey</motion.h2>
        </div>

        <div className="timeline-container">
          <div className="timeline-line" />
          {[
            { step: "Step 01", title: "Secure Login", desc: "Start your session with our high-security authentication portal. Your data is encrypted and synced across all your devices.", img: "/img/demo/snap-teacher-flow-1-login.png" },
            { step: "Step 02", title: "Interactive Dashboard", desc: "Manage all your subjects, attendance logs, and student rosters from a single, beautiful unified stream.", img: "/img/demo/snap-teacher-flow-2-dashboard.png" },
            { step: "Step 03", title: "Course Management", desc: "Creating a new subject is a breeze. Just name it, and OmniAttend generates everything you need to start tracking.", img: "/img/demo/snap-teacher-flow-3-create-course.png" },
            { step: "Step 04", title: "FaceID Attendance", desc: "Use high-speed computer vision to scan the entire room. Our AI identifies every student from a single class photo in milliseconds.", img: "/img/demo/snap-teacher-flow-5.2-photo-attendance.png" },
            { step: "Step 05", title: "Voice ID Attendance", desc: "Switch to voice mode for a futuristic roll-call. Students speak sequentially, and our AI matches their unique voice signatures.", img: "/img/demo/snap-teacher-flow-5.1-voice-attendance.png" }
          ].map((item, idx) => (
            <motion.div className="flow-step timeline-step" key={idx} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }}>
              <div className="timeline-node" />
              <div className="flow-content">
                <span className="step-badge">{item.step}</span>
                <h3 className="brand-font" style={{ fontSize: '2.1rem', marginBottom: '1rem', fontWeight: 800 }}>{item.title}</h3>
                <p style={{ fontSize: '1.05rem', opacity: 0.6 }}>{item.desc}</p>
              </div>
              <div className="flow-image">
                <div className="browser-frame">
                  <div className="browser-header">
                    <div className="browser-dots">
                      <div className="browser-dot red" />
                      <div className="browser-dot yellow" />
                      <div className="browser-dot green" />
                    </div>
                    <div className="browser-address">omniattend.ai/teacher/{item.step.toLowerCase().replace(" ", "-")}</div>
                  </div>
                  <div className="browser-content">
                    <img src={item.img} alt={item.title} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className={styles.sep} />

      <section id="student-journey" className={styles.section} style={{ padding: '8rem 1.5rem', background: 'rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
          <div className={styles.eyebrow} style={{ color: 'var(--primary)' }}>Workflow</div>
          <motion.h2 className={styles.sectionTitle} {...fadeInUp}>The Student&apos;s Journey</motion.h2>
        </div>

        <div className="timeline-container">
          <div className="timeline-line" />
          {[
            { step: "Phase 01", title: "Instant Enrollment", desc: "Students join courses in seconds using unique QR codes or course links provided by their teachers. No tedious sign-up forms.", img: "/img/demo/snap-student-flow-1-login.png" },
            { step: "Phase 02", title: "Biometric Registration", desc: "Students register their FaceID and VoiceID once. Our AI securely stores these biometrics for all future class sessions.", img: "/img/demo/snap-student-flow-2-enroll.png" },
            { step: "Phase 03", title: "Personal Dashboard", desc: "A unified view for students to track their attendance percentage across all subjects and receive real-time updates.", img: "/img/demo/snap-student-flow-3-dashboard.png" }
          ].map((item, idx) => (
            <motion.div className="flow-step timeline-step" key={idx} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }}>
              <div className="timeline-node" style={{ borderColor: 'var(--secondary)', boxShadow: '0 0 15px var(--secondary)' }} />
              <div className="flow-content">
                <span className="step-badge" style={{ color: 'var(--secondary)' }}>{item.step}</span>
                <h3 className="brand-font" style={{ fontSize: '2.1rem', marginBottom: '1rem', fontWeight: 800 }}>{item.title}</h3>
                <p style={{ fontSize: '1.05rem', opacity: 0.6 }}>{item.desc}</p>
              </div>
              <div className="flow-image">
                <div className="browser-frame" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(0, 245, 212, 0.05)' }}>
                  <div className="browser-header">
                    <div className="browser-dots">
                      <div className="browser-dot red" />
                      <div className="browser-dot yellow" />
                      <div className="browser-dot green" />
                    </div>
                    <div className="browser-address">omniattend.ai/student/{item.step.toLowerCase().replace(" ", "-")}</div>
                  </div>
                  <div className="browser-content">
                    <img src={item.img} alt={item.title} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="tech" className={styles.section} style={{ background: 'var(--surface-card)', borderRadius: '32px', border: '1px solid var(--surface-border)', margin: '4rem auto' }}>
        <motion.div className={styles.sectionHead} {...fadeInUp}>
          <div className={styles.eyebrow}>Architecture</div>
          <h2 className={styles.sectionTitle}>Advanced Tech Stack</h2>
        </motion.div>
        
        <motion.div className="bento-grid" variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once: true, margin: "-50px" }}>
          {[
            { icon: <LayoutDashboard size={28} strokeWidth={1.5} />, title: "Streamlit & React", desc: "Reactive frontend architecture paired with a robust landing layer.", tag: "Platform" },
            { icon: <Camera size={28} strokeWidth={1.5} />, title: "Face Registration", desc: "Leveraging FaceRecognition for high-fidelity facial biometrics.", tag: "Vision AI" },
            { icon: <Mic size={28} strokeWidth={1.5} />, title: "Voice Embeddings", desc: "Utilizing Resemblyzer for unique student voice signatures.", tag: "Audio AI" },
            { icon: <Server size={28} strokeWidth={1.5} />, title: "Supabase Cloud", desc: "Real-time PostgreSQL infrastructure with secure auth and sync.", tag: "Storage" }
          ].map((tech, idx) => (
            <motion.div className={styles.featureCard} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem 1.5rem' }} key={idx} variants={fadeInUp}>
              <div className={styles.fIcon} style={{ borderRadius: '50%', width: '64px', height: '64px', margin: '0 auto 1.5rem' }}>{tech.icon}</div>
              <h4 className="brand-font" style={{ fontSize: '1.15rem', marginBottom: '8px', fontWeight: 700 }}>{tech.title}</h4>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '20px' }}>{tech.desc}</p>
              <span className={styles.freeBadge} style={{ marginTop: 'auto' }}>{tech.tag}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <div className={styles.sep} />

      {/* 1. Use Cases */}
      <section className={styles.section}>
        <motion.div className={styles.sectionHead} {...fadeInUp}>
          <div className={styles.eyebrow}>Use Cases</div>
          <h2 className={styles.sectionTitle}>Built for Any Environment</h2>
          <p className={styles.sectionSub}>From large universities to corporate seminars, OmniAttend adapts to your needs.</p>
        </motion.div>
        
        <motion.div className={styles.featuresGrid} variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once: true, margin: "-50px" }}>
          {[
            { icon: <School size={32} strokeWidth={1.5} />, title: "Universities", desc: "Easily handle massive lecture halls. Our vision model processes multiple faces simultaneously." },
            { icon: <Users size={32} strokeWidth={1.5} />, title: "K-12 Education", desc: "Secure, reliable roll-calls that instantly generate absence reports for school administrators." },
            { icon: <Building size={32} strokeWidth={1.5} />, title: "Corporate Seminars", desc: "Seamless, professional check-ins for events using quick voice or QR verification." }
          ].map((usecase, idx) => (
            <motion.div className={styles.featureCard} key={idx} variants={fadeInUp}>
              <div className={styles.fIcon}>{usecase.icon}</div>
              <h3 className={styles.fTitle}>{usecase.title}</h3>
              <p className={styles.fDesc}>{usecase.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <div className={styles.sep} />

      {/* 2. Real-Time Reviews (Wall of Love) */}
      <ReviewsSection />

      <div className={styles.sep} />

      {/* 3. Pricing — Replaced with honest open-source note */}
      <section className={styles.section}>
        <motion.div className={styles.sectionHead} {...fadeInUp}>
          <div className={styles.eyebrow}>Access</div>
          <h2 className={styles.sectionTitle}>Free & Open for Educators</h2>
          <p className={styles.sectionSub}>OmniAttend AI is currently available as a free tool built for educators. No subscriptions, no hidden fees.</p>
        </motion.div>
        
        <motion.div
          style={{ display: 'flex', justifyContent: 'center' }}
          variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div className={`${styles.pricingCard} ${styles.pro}`} variants={fadeInUp} style={{ maxWidth: '480px', width: '100%' }}>
            <motion.div className={styles.liveChip} style={{ position: 'absolute', top: '16px', right: '16px', margin: 0, padding: '4px 12px', fontSize: '0.8rem' }}>Currently Free</motion.div>
            <h3 className={styles.priceTitle}>OmniAttend AI</h3>
            <p className={styles.priceDesc}>Everything included. No plans, no tiers.</p>
            <div className={styles.priceAmount}>Free</div>
            <ul className={styles.priceFeatures}>
              <li><Check size={18} /> AI FaceID Attendance from a single photo</li>
              <li><Check size={18} /> Sequential VoiceID Roll-call</li>
              <li><Check size={18} /> QR Code Student Enrollment</li>
              <li><Check size={18} /> Teacher & Student Dashboards</li>
              <li><Check size={18} /> Course & Roster Management</li>
              <li><Check size={18} /> CSV Attendance Export</li>
              <li><Check size={18} /> Supabase Cloud Storage</li>
              <li><Check size={18} /> No mobile app required</li>
            </ul>
            <Link href="http://localhost:8501/" className={styles.ctaPrimary} style={{ width: '100%', justifyContent: 'center' }}>Open the Portal</Link>
          </motion.div>
        </motion.div>
      </section>

      <div className={styles.sep} />

      {/* 4. FAQ */}
      <section className={styles.section} style={{ paddingBottom: '2rem' }}>
        <motion.div className={styles.sectionHead} {...fadeInUp}>
          <div className={styles.eyebrow}>FAQ</div>
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
        </motion.div>
        
        <div className={styles.faqContainer}>
          {[
            { q: "Is student biometric data secure?", a: "Yes, all biometric embeddings and attendance logs are securely stored in a cloud PostgreSQL database via Supabase, ensuring enterprise-grade data protection." },
            { q: "Do students need to download a mobile app?", a: "No, OmniAttend is completely web-based. Students enroll instantly by scanning a QR code with their default smartphone camera." },
            { q: "How does the FaceID attendance work?", a: "Teachers capture a single photo of the classroom. The computer vision model detects and matches all faces against the enrolled database simultaneously." },
            { q: "How does the VoiceID roll-call work?", a: "Students speak sequentially, and the app uses advanced audio embeddings to identify each unique voice signature in real-time." },
            { q: "Can I export the attendance records?", a: "Yes, all attendance logs can be instantly exported as CSV files for easy integration into your existing gradebook or school records." },
            { q: "What hardware do teachers need?", a: "Any standard laptop, tablet, or smartphone with a modern web browser, camera, and microphone can run the portal perfectly." }
          ].map((faq, idx) => (
            <motion.div className={styles.faqItem} key={idx} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <button className={styles.faqQuestion} onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                {faq.q}
                <motion.div animate={{ rotate: openFaq === idx ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={20} style={{ color: 'var(--primary)' }} />
                </motion.div>
              </button>
              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }} 
                    transition={{ duration: 0.3 }}
                  >
                    <div className={styles.faqAnswer}>{faq.a}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      <section className={styles.section} style={{ textAlign: 'center', padding: '10rem 1.5rem' }}>
        <motion.div 
          className={styles.liveChip}
          style={{ background: 'rgba(157, 78, 221, 0.1)', borderColor: 'rgba(157, 78, 221, 0.3)', color: '#e0aaff' }}
          initial={{ opacity: 0, y: -10 }} 
          whileInView={{ opacity: 1, y: 0 }} 
        >
          <Shield size={14} style={{ marginRight: '6px' }} />
          Supabase-Backed Secure Storage
        </motion.div>
        
        <motion.h2 className={styles.headline} style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }} {...fadeInUp}>
          Ready to upgrade <br/> your classroom?
        </motion.h2>
        
        <motion.p className={styles.sub} style={{ margin: '0 auto 3rem' }} {...fadeInUp}>
          Stop doing roll-calls manually. OmniAttend AI handles attendance using your device camera and microphone — no extra hardware, no app download.
        </motion.p>
        
        <motion.div {...fadeInUp}>
          <Link href="http://localhost:8501/" className={styles.ctaPrimary} style={{ padding: '1.25rem 2.5rem', fontSize: '1.1rem' }}>
            Start AI Attendance Now
          </Link>
        </motion.div>
      </section>

      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', marginBottom: '20px' }}>
              <img src="/img/logonew.png" alt="OmniAttend AI Logo" style={{ height: "36px" }} />
              <div className="brand-font text-gradient" style={{ fontSize: '1.6rem', fontWeight: 700 }}>OmniAttend AI</div>
            </Link>
            <p>The next generation of classroom management, powered by advanced AI biometrics. Join the future of education today.</p>
          </div>
          
          <div className="footer-col">
            <h4 className="brand-font" style={{ fontWeight: 700 }}>Product</h4>
            <ul>
              <li><Link href="#features">AI Attendance</Link></li>
              <li><Link href="#features">Smart Roster</Link></li>
              <li><Link href="#tech">Tech Stack</Link></li>
              <li><Link href="#student-journey">Student Portal</Link></li>
            </ul>
          </div>
          
          <div className="footer-col">
            <h4 className="brand-font" style={{ fontWeight: 700 }}>Experience</h4>
            <ul>
              <li><Link href="#journey">Teacher Journey</Link></li>
              <li><Link href="#student-journey">Student Journey</Link></li>
              <li><Link href="#features">Voice ID Roll-call</Link></li>
              <li><Link href="#features">FaceID Scan</Link></li>
            </ul>
          </div>
          
          <div className="footer-col">
            <h4 className="brand-font" style={{ fontWeight: 700 }}>Company</h4>
            <ul>
              <li><Link href="#">About Us</Link></li>
              <li><Link href="#">How it Works</Link></li>
              <li><Link href="#">Privacy Policy</Link></li>
              <li><Link href="#">Terms of Use</Link></li>
            </ul>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', paddingTop: '40px', borderTop: '1px solid var(--surface-border)', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
          <p>&copy; 2026 OmniAttend AI. Built with ❤️ for educators everywhere.</p>
        </div>
      </footer>
    </>
  );
}
