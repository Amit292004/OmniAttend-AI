import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "OmniAttend AI | AI Powered Smart Attendance System",
  description: "Revolutionizing the classroom with next-gen computer vision and voice biometrics. Fast, accurate, secure and automated attendance tracking.",
  keywords: [
    "OmniAttend",
    "OmniAttend AI",
    "AI Attendance",
    "Smart Attendance System",
    "Face Recognition Attendance",
    "Voice Biometrics Attendance",
    "Classroom Automation",
    "Student Roster Management",
    "Amit Sharma",
    "Bounce Back Academy",
    "Full Stack AI Developer"
  ],
  authors: [{ name: "Amit Sharma", url: "https://github.com/Amit292004" }],
  creator: "Amit Sharma",
  publisher: "OmniAttend AI",
  metadataBase: new URL("https://omni-attend-ai.vercel.app"),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://omni-attend-ai.vercel.app",
    title: "OmniAttend AI | AI Powered Smart Attendance System",
    description: "Revolutionizing the classroom with next-gen computer vision and voice biometrics. Automated, fast, and secure.",
    siteName: "OmniAttend AI",
    images: [
      {
        url: "https://omni-attend-ai.vercel.app/img/logonew.png",
        width: 800,
        height: 600,
        alt: "OmniAttend AI Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OmniAttend AI | AI Powered Smart Attendance System",
    description: "Revolutionizing the classroom with next-gen computer vision and voice biometrics.",
    images: ["https://omni-attend-ai.vercel.app/img/logonew.png"],
  },
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Structured Data (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://omni-attend-ai.vercel.app/#software",
        "name": "OmniAttend AI",
        "url": "https://omni-attend-ai.vercel.app",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "All",
        "description": "Revolutionizing the classroom with next-gen computer vision and voice biometrics for instant attendance tracking.",
        "offers": {
          "@type": "Offer",
          "price": "0.00",
          "priceCurrency": "USD"
        },
        "author": {
          "@type": "Person",
          "name": "Amit Sharma",
          "email": "amitsharma72020@gmail.com",
          "url": "https://github.com/Amit292004"
        },
        "creator": {
          "@type": "Person",
          "name": "Amit Sharma",
          "email": "amitsharma72020@gmail.com",
          "url": "https://github.com/Amit292004"
        },
        "screenshot": "https://omni-attend-ai.vercel.app/img/demo/snap-teacher-flow-2-dashboard.png",
        "featureList": [
          "AI Face Analysis: Detect and match student faces from a single classroom photo",
          "Sequential Voice ID: Audio biometrics for secure student check-ins",
          "QR-Driven Roster: Instant enrollment and student onboarding"
        ]
      },
      {
        "@type": "Person",
        "@id": "https://omni-attend-ai.vercel.app/#amitsharma",
        "name": "Amit Sharma",
        "email": "amitsharma72020@gmail.com",
        "url": "https://github.com/Amit292004",
        "jobTitle": "Full Stack AI Developer",
        "worksFor": {
          "@type": "Organization",
          "name": "OmniAttend AI"
        },
        "knowsAbout": [
          "Artificial Intelligence", 
          "Computer Vision", 
          "Software Development", 
          "React", 
          "Next.js"
        ],
        "sameAs": [
          "https://github.com/Amit292004",
          "https://bouncebackacademy.vercel.app/"
        ]
      },
      {
        "@type": "FAQPage",
        "@id": "https://omniattend.ai/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Is student biometric data secure?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, all biometric embeddings and attendance logs are securely stored in a cloud PostgreSQL database via Supabase, ensuring enterprise-grade data protection."
            }
          },
          {
            "@type": "Question",
            "name": "Do students need to download a mobile app?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "No, OmniAttend is completely web-based. Students enroll instantly by scanning a QR code with their default smartphone camera."
            }
          },
          {
            "@type": "Question",
            "name": "How does the FaceID attendance work?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Teachers capture a single photo of the classroom. The computer vision model detects and matches all faces against the enrolled database simultaneously."
            }
          },
          {
            "@type": "Question",
            "name": "How does the VoiceID roll-call work?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Students speak sequentially, and the app uses advanced audio embeddings to identify each unique voice signature in real-time."
            }
          },
          {
            "@type": "Question",
            "name": "Can I export the attendance records?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, all attendance logs can be instantly exported as CSV files for easy integration into your existing gradebook or school records."
            }
          },
          {
            "@type": "Question",
            "name": "What hardware do teachers need?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Any standard laptop, tablet, or smartphone with a modern web browser, camera, and microphone can run the portal perfectly."
            }
          }
        ]
      }
    ]
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
