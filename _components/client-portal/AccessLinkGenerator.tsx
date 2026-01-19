"use client";

import { useState } from "react";
import { generateClientAccessLink } from "../../app/lib/clerkClientPortal";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Copy } from "lucide-react";

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
            {isGenerating ? "Generating..." : "Generate Access Link"}
          </Button>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      {accessLink && (
        <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
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
            This link is reusable - clients can use it multiple times and bookmark it. Share it with your client at{" "}
            <span className="font-medium">{clientEmail}</span>.
          </p>
        </div>
      )}
    </div>
  );
}
