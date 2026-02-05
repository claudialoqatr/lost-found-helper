import { useEffect, useRef } from "react";

interface TurnstileProps {
  siteKey: string;
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

export function Turnstile({ 
  siteKey, 
  onSuccess, 
  onError, 
  onExpire,
  className 
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const renderedRef = useRef(false);
  
  // Store callbacks in refs to avoid re-renders causing widget recreation
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);
  
  // Update refs when callbacks change
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;
  onExpireRef.current = onExpire;

  useEffect(() => {
    // Prevent double rendering within the same mount
    if (renderedRef.current) return;
    
    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile || renderedRef.current) return;
      
      renderedRef.current = true;

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onSuccessRef.current(token),
        "error-callback": () => onErrorRef.current?.(),
        "expired-callback": () => onExpireRef.current?.(),
        theme: "auto",
      });
    };

    // Check if script is already loaded
    if (window.turnstile) {
      renderWidget();
    } else {
      // Check if script is currently loading
      const existingScript = document.querySelector('script[src*="turnstile"]');
      if (existingScript) {
        window.onloadTurnstileCallback = renderWidget;
      } else {
        // Load Turnstile script
        window.onloadTurnstileCallback = renderWidget;
        
        const script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }

    // Cleanup function - ALWAYS runs on unmount to reset state
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // Widget might already be removed
        }
        widgetIdRef.current = null;
      }
      renderedRef.current = false;
    };
  }, [siteKey]);

  return <div ref={containerRef} className={className} />;
}
