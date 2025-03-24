"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import Button from "../../ui/Button";

/**
 * Component that handles token verification and authenticates users with Clerk
 */
const TokenVerifier: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, signIn } = useSignIn();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    // Don't attempt verification until Clerk is loaded and signIn is available
    if (!isLoaded || !signIn) return;

    async function verifyToken() {
      try {
        // Safely get the token from search params
        const token = searchParams?.get("client_token");

        console.log("token", token);

        if (!token) {
          setError("Invalid or missing token");
          setIsLoading(false);
          return;
        }

        // The non-null assertion is safe here because we've already checked above
        await signIn!.create({
          strategy: "ticket",
          ticket: token,
        });

        // If successful, redirect to dashboard
        router.push("/client-portal/dashboard");
      } catch (err) {
        console.error("Authentication error:", err);
        setError(
          "Failed to authenticate. The link may have expired or is invalid.",
        );
        setIsLoading(false);
      }
    }

    verifyToken();
  }, [searchParams, router, isLoaded, signIn]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
          <div className="mb-4 text-red-500">{error}</div>
          <p className="mb-4">
            Please contact support or request a new access link.
          </p>
          <Button onClick={() => router.push("/")} variant="secondary">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-4 text-xl font-semibold">Verifying your access...</h2>
        <div className="my-4 flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
        <p className="text-center text-gray-600">
          Please wait while we verify your access to the client portal.
        </p>
      </div>
    </div>
  );
};

export default TokenVerifier;
