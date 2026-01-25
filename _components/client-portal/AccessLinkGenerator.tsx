"use client";

import { useEffect, useMemo, useState } from "react";
import { generateClientAccessLink } from "../../app/lib/clerkClientPortal";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Copy } from "lucide-react";
import { getBaseUrl } from "@/lib/utils";

interface AccessLinkGeneratorProps {
  clientId: string;
  clientName: string;
  defaultEmail?: string | null;
  existingAccessToken?: string | null;
  existingAccessTokenExpiry?: Date | string | null;
}

export default function AccessLinkGenerator({
  clientId,
  clientName,
  defaultEmail,
  existingAccessToken,
  existingAccessTokenExpiry,
}: AccessLinkGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [accessLink, setAccessLink] = useState("");
  const [clientEmail, setClientEmail] = useState(defaultEmail || "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (defaultEmail) {
      setClientEmail(defaultEmail);
    }
  }, [defaultEmail]);

  const existingLink = useMemo(() => {
    if (!existingAccessToken) return "";
    const baseUrl =
      typeof window !== "undefined" ? window.location.origin : getBaseUrl();
    try {
      const url = new URL("/acceptToken", baseUrl);
      url.searchParams.set("clientId", clientId);
      url.searchParams.set("accessToken", existingAccessToken);
      return url.toString();
    } catch {
      return "";
    }
  }, [clientId, existingAccessToken]);

  const existingExpiryLabel = useMemo(() => {
    if (!existingAccessTokenExpiry) return "No expiry (reusable)";
    const parsed = new Date(existingAccessTokenExpiry);
    if (Number.isNaN(parsed.getTime())) return "Unknown expiry";
    return parsed.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [existingAccessTokenExpiry]);

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
      <div className="space-y-2">
        <Label htmlFor="clientEmail">Client Email Address</Label>
        <div className="flex gap-2">
          <Input
            id="clientEmail"
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="client@example.com"
            disabled={isGenerating}
            className="flex-1"
          />
          <Button
            onClick={handleGenerateAccess}
            disabled={isGenerating || !clientEmail}
          >
            {isGenerating
              ? "Generating..."
              : existingAccessToken
                ? "Generate New Link"
                : "Generate Access Link"}
          </Button>
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>

      {existingLink && (
        <div className="bg-muted/30 space-y-3 rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label className="text-base font-medium">
              Existing Access Link
            </Label>
            <span className="text-muted-foreground text-xs">
              Expiry: {existingExpiryLabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              readOnly
              value={existingLink}
              className="flex-1 font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(existingLink);
                toast.success("Link copied to clipboard!");
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {accessLink && (
        <div className="bg-muted/50 space-y-3 rounded-lg border p-4">
          <Label className="text-base font-medium">Client Access Link</Label>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              readOnly
              value={accessLink}
              className="flex-1 font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(accessLink);
                toast.success("Link copied to clipboard!");
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground text-sm">
            This link is reusable - clients can use it multiple times and
            bookmark it. Share it with your client at{" "}
            <span className="font-medium">{clientEmail}</span>.
          </p>
        </div>
      )}
    </div>
  );
}
