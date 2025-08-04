"use client";

import { useState } from "react";
import { generateClientAccessLink } from "../../app/lib/clerkClientPortal";
import toast from "react-hot-toast";

interface AccessLinkGeneratorProps {
  clientId: string;
  clientName: string;
}

export default function AccessLinkGenerator({
  clientId,
  clientName,
}: AccessLinkGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [accessLink, setAccessLink] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [error, setError] = useState("");

  async function handleGenerateAccess() {
    // Reset error state
    setError("");

    // Validate email
    if (!clientEmail || !clientEmail.includes("@")) {
      setError("Please enter a valid email address for the client");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateClientAccessLink(
        clientId,
        clientName,
        clientEmail,
      );
      if (result.success) {
        setAccessLink(result.magicLink);
        toast.success("Access link generated successfully!");
      } else {
        setError("Failed to generate access link");
        toast.error("Failed to generate access link");
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        "Failed to generate access link: " +
        (error instanceof Error ? error.message : String(error));
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="clientEmail"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Client Email Address
        </label>
        <div className="flex gap-2">
          <input
            id="clientEmail"
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="client@example.com"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            disabled={isGenerating}
          />
          <button
            onClick={handleGenerateAccess}
            disabled={isGenerating || !clientEmail}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "Generate Access Link"}
          </button>
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>

      {accessLink && (
        <div className="mt-4 rounded bg-gray-100 p-3">
          <p className="mb-2 font-medium">Client Access Link:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={accessLink}
              className="flex-1 rounded border p-2 text-sm"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(accessLink);
                toast.success("Link copied to clipboard!");
              }}
              className="rounded bg-gray-200 px-3 py-1 text-gray-800 hover:bg-gray-300"
            >
              Copy
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            This link is reusable - clients can use it multiple times and bookmark it. Share it with your client at{" "}
            {clientEmail}.
          </p>
        </div>
      )}
    </div>
  );
}
