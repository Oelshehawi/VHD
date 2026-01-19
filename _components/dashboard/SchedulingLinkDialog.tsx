"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Copy,
  RefreshCw,
  Link2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  getSchedulingLink,
  regenerateSchedulingLink,
} from "../../app/lib/actions/autoScheduling.actions";

interface SchedulingLinkDialogProps {
  jobsDueSoonId: string;
  jobTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SchedulingLinkDialog({
  jobsDueSoonId,
  jobTitle,
  isOpen,
  onClose,
}: SchedulingLinkDialogProps) {
  const [link, setLink] = useState<string | null>(null);
  const [hasExistingRequest, setHasExistingRequest] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmRegenerate, setShowConfirmRegenerate] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLink = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getSchedulingLink(jobsDueSoonId);
      if (result.success && result.link) {
        setLink(result.link);
        setHasExistingRequest(result.hasExistingRequest || false);
      } else {
        setError(result.error || "Failed to get link");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [jobsDueSoonId]);

  // Fetch link when dialog opens
  useEffect(() => {
    if (isOpen && jobsDueSoonId) {
      fetchLink();
    }
  }, [isOpen, jobsDueSoonId, fetchLink]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    if (link) {
      try {
        await navigator.clipboard.writeText(link);
        setIsCopied(true);
        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current);
        }
        copyTimeoutRef.current = setTimeout(() => setIsCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy scheduling link:", error);
      }
    }
  };

  const handleRegenerate = async () => {
    setShowConfirmRegenerate(false);
    setIsLoading(true);
    setError(null);
    try {
      const result = await regenerateSchedulingLink(jobsDueSoonId);
      if (result.success && result.link) {
        setLink(result.link);
        setHasExistingRequest(false);
      } else {
        setError(result.error || "Failed to regenerate link");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setLink(null);
    setHasExistingRequest(false);
    setError(null);
    setIsCopied(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Scheduling Link
            </DialogTitle>
            <DialogDescription>{jobTitle}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="border-border border-t-primary h-8 w-8 animate-spin rounded-full border-2" />
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-950/30">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={fetchLink}
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                {/* Warning if there's an existing request */}
                {hasExistingRequest && (
                  <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950/30">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        Request Already Submitted
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-300">
                        The client has already submitted a scheduling request.
                        Regenerating will cancel their request.
                      </p>
                    </div>
                  </div>
                )}

                {/* Link input with copy button */}
                <div className="flex gap-2">
                  <Input
                    value={link || ""}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={handleCopy}
                    variant={isCopied ? "default" : "outline"}
                    className="shrink-0"
                  >
                    {isCopied ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>

                {/* Regenerate button */}
                <div className="flex items-center justify-between border-t pt-4">
                  <p className="text-muted-foreground text-xs">
                    Link expires in 30 days
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      hasExistingRequest
                        ? setShowConfirmRegenerate(true)
                        : handleRegenerate()
                    }
                    disabled={isLoading}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for regenerating with existing request */}
      <AlertDialog
        open={showConfirmRegenerate}
        onOpenChange={setShowConfirmRegenerate}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Existing Request?</AlertDialogTitle>
            <AlertDialogDescription>
              The client has already submitted a scheduling request. Generating
              a new link will cancel their existing request. They&apos;ll need
              to submit a new request using the new link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Existing</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRegenerate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Request & Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
