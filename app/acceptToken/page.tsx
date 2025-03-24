"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn, useClerk } from "@clerk/nextjs";
import Image from "next/image";
import dynamic from "next/dynamic";

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-darkGreen border-t-transparent"></div>
  </div>
);

function AcceptTokenContent() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { signOut } = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams?.get("client_token");

  useEffect(() => {
    // Clean up any existing sessions
    const performSignOut = async () => {
      if (isLoaded) {
        try {
          await signOut();
        } catch (err) {
          // Ignore errors from signOut
        }
      }
    };

    performSignOut();
  }, [isLoaded, signOut]);

  useEffect(() => {
    async function verifyToken() {
      // Prevent multiple attempts
      if (attemptRef.current) return;
      attemptRef.current = true;

      if (!isLoaded || !token) {
        setError("Invalid or missing access token");
        setLoading(false);
        return;
      }

      try {
        const signInAttempt = await signIn.create({
          strategy: "ticket",
          ticket: token,
        });

        if (signInAttempt.status === "complete") {
          await setActive({ session: signInAttempt.createdSessionId });

          // Keep loading state while redirecting
          setTimeout(() => {
            router.push("/client-portal");
          }, 1500);
        } else {
          setError("Sign-in failed. Please try again or contact support.");
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Error signing in with token:", err);

        // Handle rate limiting specifically
        if (err?.status === 429) {
          setError("Too many attempts. Please wait a moment and try again.");
        } else {
          setError(
            "Failed to sign in. The access link may have expired or is invalid.",
          );
        }
        setLoading(false);
      }
    }

    // Verify token when component is loaded and clerk is ready
    if (isLoaded && token) {
      verifyToken();
    } else if (isLoaded && !token) {
      setError("No access token provided");
      setLoading(false);
    }
  }, [isLoaded, router, setActive, signIn, token]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        <div className="flex flex-col items-center justify-center space-y-6">
          {/* Logo */}
          <div className="mb-4 flex justify-center">
            <Image
              src="/images/logo.png"
              alt="Company Logo"
              width={180}
              height={60}
              priority
              className="h-auto"
            />
          </div>

          <h1 className="text-center text-2xl font-bold text-gray-900">
            Client Portal Access
          </h1>

          {loading ? (
            <div className="my-8 flex flex-col items-center space-y-4">
              <LoadingSpinner />
              <p className="text-center text-gray-600">
                Preparing your access...
              </p>
            </div>
          ) : error ? (
            <div className="my-6 rounded-lg bg-red-50 p-4 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => router.push("/")}
                className="hover:bg-darkGreen-2 mt-4 rounded-md bg-darkGreen px-4 py-2 text-white"
              >
                Return Home
              </button>
            </div>
          ) : (
            <p className="text-center text-gray-600">
              Please wait while we verify your access...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Dynamically import the component with no SSR
const AcceptTokenPage = dynamic(() => Promise.resolve(AcceptTokenContent), {
  ssr: false,
});

export default AcceptTokenPage;
