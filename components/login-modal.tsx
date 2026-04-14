"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { signInWithGoogle } from "@/app/actions/auth";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function LoginModal() {
  const { status } = useSession();
  const isOpen = status === "unauthenticated";

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="sm:max-w-[440px] rounded-xl bg-cozy-surface shadow-[0_8px_30px_rgba(0,0,0,0.12)] text-center"
        showCloseButton={false}
      >
        <div className="flex flex-col items-center gap-6 py-6 px-2">
          {/* Cozyy title */}
          <h1 className="font-heading text-4xl tracking-tight text-cozy-text-primary">
            Cozyy
          </h1>

          <div className="space-y-2">
            <h2 className="font-sans text-lg text-cozy-text-primary">
              Welcome
            </h2>
            <p className="font-ui text-sm text-cozy-text-secondary max-w-[320px]">
              Sign in with Google to connect the calendar you&apos;d like Cozyy
              to sync with.
            </p>
          </div>

          <form action={signInWithGoogle} className="w-full">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-cozy-border bg-cozy-surface hover:bg-cozy-accent-light transition-colors duration-200 font-ui text-sm font-medium text-cozy-text-primary"
            >
              <GoogleIcon className="h-5 w-5" />
              Continue with Google
            </button>
          </form>

          <p className="font-ui text-[11px] text-cozy-text-tertiary max-w-[280px]">
            By continuing, you agree to let Cozyy access your Google Calendar
            to display and sync your schedules.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
