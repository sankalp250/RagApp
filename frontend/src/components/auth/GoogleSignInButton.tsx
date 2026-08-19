"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleSignInButtonProps {
  text?: "signin_with" | "signup_with" | "continue_with";
  onError?: (error: string) => void;
}

export function GoogleSignInButton({
  text = "continue_with",
  onError,
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const { googleLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "727576011653-gc3ubik345d31qv0ntme6bieuub5h7vm.apps.googleusercontent.com";

  const handleCredentialResponse = async (response: any) => {
    if (!response || !response.credential) {
      onError?.("No credentials returned by Google");
      return;
    }

    setLoading(true);
    try {
      // Pass the real signed Google ID Token to backend /auth/google
      await googleLogin(response.credential);
      router.push("/dashboard");
    } catch (err: any) {
      onError?.(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const initializeGoogle = () => {
    if (typeof window === "undefined" || !window.google?.accounts?.id) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (buttonContainerRef.current) {
        buttonContainerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonContainerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: text,
          shape: "pill",
          logo_alignment: "left",
          width: 380,
        });
      }
    } catch (e: any) {
      console.error("Error initializing Google Identity Services:", e);
    }
  };

  useEffect(() => {
    if (scriptLoaded && window.google?.accounts?.id) {
      initializeGoogle();
    }
  }, [scriptLoaded, text]);

  const handleManualClick = () => {
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If One-Tap is suppressed, re-render the button
          initializeGoogle();
        }
      });
    }
  };

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          setScriptLoaded(true);
          initializeGoogle();
        }}
      />

      <div className="w-full flex flex-col items-center justify-center min-h-[44px]">
        {loading ? (
          <div className="w-full py-2.5 px-4 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Authenticating with Google...</span>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            {/* Native Google rendered button container */}
            <div ref={buttonContainerRef} className="w-full flex justify-center" />
          </div>
        )}
      </div>
    </>
  );
}
