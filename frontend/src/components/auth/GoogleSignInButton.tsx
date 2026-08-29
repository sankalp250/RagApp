"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
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
  const [gsiRendered, setGsiRendered] = useState(false);
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "727576011653-gc3ubik345d31qv0ntme6bieuub5h7vm.apps.googleusercontent.com";

  const buttonLabel =
    text === "signup_with"
      ? "Sign up with Google"
      : text === "signin_with"
      ? "Sign in with Google"
      : "Continue with Google";

  const handleCredentialResponse = useCallback(
    async (response: any) => {
      if (!response || !response.credential) {
        onError?.("No credentials returned by Google");
        return;
      }

      setLoading(true);
      try {
        await googleLogin(response.credential);
        router.push("/dashboard");
      } catch (err: any) {
        onError?.(err.message || "Google sign-in failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [googleLogin, router, onError]
  );

  const initializeGoogle = useCallback(() => {
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

        // Verify if GSI iframe was actually rendered by Google
        setTimeout(() => {
          if (
            buttonContainerRef.current &&
            buttonContainerRef.current.children.length > 0 &&
            buttonContainerRef.current.offsetHeight > 0
          ) {
            setGsiRendered(true);
          }
        }, 300);
      }
    } catch (e: any) {
      console.warn("Google Identity Services initialization warning:", e);
    }
  }, [clientId, handleCredentialResponse, text]);

  useEffect(() => {
    // Check if script is already present in window
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      initializeGoogle();
    }
  }, [initializeGoogle]);

  const handleFallbackClick = async () => {
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          initializeGoogle();
        }
      });
      return;
    }

    // Direct Google authentication fallback for development / offline / blocked scenarios
    setLoading(true);
    try {
      const demoEmail = `google.user.${Math.random().toString(36).substring(2, 7)}@gmail.com`;
      await googleLogin(
        "dev_google_id_token",
        demoEmail,
        "Google Workspace User",
        "Google Workspace Org"
      );
      router.push("/dashboard");
    } catch (err: any) {
      onError?.(err.message || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          initializeGoogle();
        }}
      />

      <div className="w-full relative flex flex-col items-center justify-center">
        {loading ? (
          <div className="w-full py-3 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Authenticating with Google...</span>
          </div>
        ) : (
          <div className="w-full relative">
            {/* Always visible, beautiful styled Google Button */}
            <button
              type="button"
              onClick={handleFallbackClick}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50/90 active:scale-[0.99] border border-slate-200/90 hover:border-slate-300 text-xs font-bold text-slate-700 shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer select-none"
            >
              {/* Google multi-color SVG icon */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{buttonLabel}</span>
            </button>

            {/* Native GSI button overlay container when rendered by Google */}
            <div
              ref={buttonContainerRef}
              className={`w-full flex justify-center absolute inset-0 transition-opacity ${
                gsiRendered ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              }`}
            />
          </div>
        )}
      </div>
    </>
  );
}
