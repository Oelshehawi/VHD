"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import {
  FaCopy,
  FaLink,
  FaTrash,
  FaCreditCard,
  FaUniversity,
} from "react-icons/fa";
import { StripePaymentSettings } from "../../app/lib/typeDefinitions";
import {
  configureStripePaymentSettings,
  generatePaymentLink,
  getPaymentLinkStatus,
  revokePaymentLink,
} from "../../app/lib/actions/stripe.actions";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";

interface StripePaymentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  invoiceStatus: string;
  onSettingsUpdate?: (settings: StripePaymentSettings) => void;
}

export default function StripePaymentSettingsModal({
  isOpen,
  onClose,
  invoiceId,
  invoiceStatus,
  onSettingsUpdate,
}: StripePaymentSettingsModalProps) {
  const { user } = useUser();
  const [settings, setSettings] = useState<StripePaymentSettings>({
    enabled: false,
    allowCreditCard: true,
    allowBankPayment: false,
  });
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [linkExpiresAt, setLinkExpiresAt] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getPaymentLinkStatus(invoiceId);
      if (result.success) {
        if (result.settings) {
          setSettings(result.settings);
        }
        setPaymentLink(result.paymentLink || null);
        setLinkExpiresAt(result.expiresAt || null);
        setIsExpired(result.isExpired || false);
      }
    } catch (error) {
      console.error("Error loading payment settings:", error);
      toast.error("Failed to load payment settings");
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    if (isOpen && invoiceId) {
      loadSettings();
    }
  }, [isOpen, invoiceId, loadSettings]);

  const handleToggleEnabled = async (checked: boolean) => {
    const newSettings = { ...settings, enabled: checked };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleToggleCreditCard = async (checked: boolean) => {
    // Must have at least one payment method enabled
    if (!checked && !settings.allowBankPayment) {
      toast.error("At least one payment method must be enabled");
      return;
    }
    const newSettings = { ...settings, allowCreditCard: checked };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleToggleBankPayment = async (checked: boolean) => {
    // Must have at least one payment method enabled
    if (!checked && !settings.allowCreditCard) {
      toast.error("At least one payment method must be enabled");
      return;
    }
    const newSettings = { ...settings, allowBankPayment: checked };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const saveSettings = async (newSettings: StripePaymentSettings) => {
    setIsSaving(true);
    try {
      const result = await configureStripePaymentSettings(
        invoiceId,
        {
          enabled: newSettings.enabled,
          allowCreditCard: newSettings.allowCreditCard,
          allowBankPayment: newSettings.allowBankPayment,
        },
        user?.fullName || user?.id || "unknown",
      );

      if (result.success) {
        toast.success("Payment settings updated");
        onSettingsUpdate?.(newSettings);
      } else {
        toast.error(result.error || "Failed to update settings");
      }
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    try {
      const result = await generatePaymentLink(
        invoiceId,
        user?.fullName || user?.id || "unknown",
      );

      if (result.success) {
        setPaymentLink(result.paymentLink || null);
        setLinkExpiresAt(result.expiresAt || null);
        setIsExpired(false);
        // Also enable Stripe payments if not already
        if (!settings.enabled) {
          setSettings((prev) => ({ ...prev, enabled: true }));
        }
        toast.success("Payment link generated");
      } else {
        toast.error(result.error || "Failed to generate payment link");
      }
    } catch (error) {
      toast.error("Failed to generate payment link");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (paymentLink) {
      await navigator.clipboard.writeText(paymentLink);
      toast.success("Payment link copied to clipboard");
    }
  };

  const handleRevokeLink = async () => {
    try {
      const result = await revokePaymentLink(
        invoiceId,
        user?.fullName || user?.id || "unknown",
      );

      if (result.success) {
        setPaymentLink(null);
        setLinkExpiresAt(null);
        setIsExpired(false);
        toast.success("Payment link revoked");
      } else {
        toast.error(result.error || "Failed to revoke payment link");
      }
    } catch (error) {
      toast.error("Failed to revoke payment link");
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isPaid = invoiceStatus === "paid";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaCreditCard className="text-darkGreen" />
            Online Payment Settings
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="border-darkGreen h-8 w-8 animate-spin rounded-full border-b-2" />
          </div>
        ) : isPaid ? (
          <div className="py-6 text-center">
            <Badge variant="default" className="mb-3 bg-green-600">
              Invoice Paid
            </Badge>
            <p className="text-muted-foreground">
              This invoice has already been paid. Payment settings cannot be
              modified.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Enable/Disable Online Payments */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enabled" className="font-medium">
                  Enable Online Payments
                </Label>
                <p className="text-muted-foreground text-sm">
                  Allow clients to pay this invoice online via Stripe
                </p>
              </div>
              <Switch
                id="enabled"
                checked={settings.enabled}
                onCheckedChange={handleToggleEnabled}
                disabled={isSaving}
              />
            </div>

            {settings.enabled && (
              <>
                <Separator />

                {/* Payment Methods */}
                <div className="space-y-4">
                  <Label className="font-medium">Payment Methods</Label>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaCreditCard className="text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Credit/Debit Card</p>
                        <p className="text-muted-foreground text-xs">
                          Fee: 2.9% + $0.30 (passed to client)
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.allowCreditCard}
                      onCheckedChange={handleToggleCreditCard}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaUniversity className="text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          Canadian Bank (PAD)
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Fee: 0.8% capped at $5 (5-7 day processing)
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.allowBankPayment}
                      onCheckedChange={handleToggleBankPayment}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <Separator />

                {/* Payment Link */}
                <div className="space-y-3">
                  <Label className="font-medium">Payment Link</Label>

                  {paymentLink && !isExpired ? (
                    <div className="space-y-3">
                      <div className="bg-muted border-border flex items-center gap-2 rounded-lg border p-3">
                        <FaLink className="text-primary shrink-0" />
                        <input
                          type="text"
                          readOnly
                          value={paymentLink}
                          className="text-foreground flex-1 truncate border-none bg-transparent text-sm outline-none"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCopyLink}
                          className="shrink-0"
                        >
                          <FaCopy className="h-4 w-4" />
                        </Button>
                      </div>

                      {linkExpiresAt && (
                        <p className="text-muted-foreground text-xs">
                          Expires: {formatDate(linkExpiresAt)}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyLink}
                          className="flex-1"
                        >
                          <FaCopy className="mr-2 h-4 w-4" />
                          Copy Link
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <FaTrash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Revoke Payment Link?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will invalidate the current payment link.
                                Clients will no longer be able to use it. You
                                can generate a new link afterwards.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleRevokeLink}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Revoke Link
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {isExpired && (
                        <p className="text-sm text-amber-600">
                          The previous payment link has expired.
                        </p>
                      )}
                      <Button
                        onClick={handleGenerateLink}
                        disabled={isGenerating}
                        className="bg-darkGreen hover:bg-darkGreen/90 w-full"
                      >
                        {isGenerating ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FaLink className="mr-2 h-4 w-4" />
                            Generate Payment Link
                          </>
                        )}
                      </Button>
                      <p className="text-muted-foreground text-xs">
                        Payment links are valid for 30 days. Include this link
                        in invoice emails to allow clients to pay online.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
