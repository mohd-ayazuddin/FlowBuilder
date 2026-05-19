import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlowBuilder - Interactive Demo Flow Builder",
  description: "Build interactive demo flows for live client demos, training sessions, and workflow visualization.",
  icons: {
    icon: [
      {
        url: "/logo.svg",
        type: "image/svg+xml",
        sizes: "any",
      },
      {
        url: "/logo.png",
        type: "image/png",
        sizes: "192x192",
      },
    ],
    apple: [
      {
        url: "/logo.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FlowBuilder",
  },
  openGraph: {
    title: "FlowBuilder - Interactive Demo Flow Builder",
    description: "Build interactive demo flows for live client demos, training sessions, and workflow visualization.",
    url: "https://flowbuilder.app",
    siteName: "FlowBuilder",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "FlowBuilder Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlowBuilder - Interactive Demo Flow Builder",
    description: "Build interactive demo flows for live client demos, training sessions, and workflow visualization.",
    images: ["/logo.png"],
    creator: "@flowbuilder",
  },
  manifest: "/manifest.json",
  keywords: ["flow builder", "demo flows", "workflow visualization", "training"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Redirect loop detection and self-healing script.
            Runs BEFORE React hydrates to prevent infinite redirect loops. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Redirect loop detection
                  var redirectCount = parseInt(sessionStorage.getItem('fb_redirect_count') || '0', 10);
                  var lastRedirectTime = parseInt(sessionStorage.getItem('fb_redirect_time') || '0', 10);
                  var now = Date.now();

                  // If more than 5 redirects in the last 10 seconds, we're in a loop
                  if (now - lastRedirectTime < 10000 && redirectCount >= 5) {
                    console.warn('[FlowBuilder] Redirect loop detected! Entering safe mode.');
                    sessionStorage.setItem('fb_safe_mode', 'true');
                    sessionStorage.setItem('fb_redirect_count', '0');
                    // Clear any problematic cookies
                    document.cookie.split(";").forEach(function(c) {
                      var name = c.trim().split("=")[0];
                      if (name.startsWith('sb-') || name === 'flowbuilder_guest_mode') {
                        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
                      }
                    });
                  } else {
                    sessionStorage.setItem('fb_redirect_count', String(redirectCount + 1));
                    sessionStorage.setItem('fb_redirect_time', String(now));
                    // Reset count after 10 seconds of no redirects
                    setTimeout(function() {
                      sessionStorage.setItem('fb_redirect_count', '0');
                    }, 10000);
                  }
                } catch(e) {
                  // Silently fail - this is just a safety net
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
