export type EmailDeliveryMode = "live" | "catchall" | "blackhole";

export interface ResolvedEmailRecipient {
  originalTo: string;
  resolvedTo: string;
  mode: EmailDeliveryMode;
}

const BLACKHOLE_RECIPIENT = "test@blackhole.postmarkapp.com";

function readMode(): string {
  return (process.env.EMAIL_DELIVERY_MODE || "live").trim().toLowerCase();
}

export function getEmailDeliveryMode(): EmailDeliveryMode {
  const mode = readMode();
  if (mode === "catchall" || mode === "blackhole" || mode === "live") {
    return mode;
  }
  return "live";
}

export function getPostmarkServerToken(): string {
  return process.env.POSTMARK_CLIENT || "";
}

export function resolveEmailRecipient(originalTo: string): ResolvedEmailRecipient {
  const mode = getEmailDeliveryMode();

  if (mode === "blackhole") {
    return {
      originalTo,
      resolvedTo: BLACKHOLE_RECIPIENT,
      mode,
    };
  }

  if (mode === "catchall") {
    const catchall = (process.env.EMAIL_TEST_CATCHALL_TO || "").trim();
    if (!catchall) {
      throw new Error(
        "EMAIL_TEST_CATCHALL_TO is required when EMAIL_DELIVERY_MODE=catchall",
      );
    }
    return {
      originalTo,
      resolvedTo: catchall,
      mode,
    };
  }

  return {
    originalTo,
    resolvedTo: originalTo,
    mode,
  };
}

export function withEmailTestTemplateModel(
  baseModel: Record<string, unknown>,
  recipient: ResolvedEmailRecipient,
): Record<string, unknown> {
  if (recipient.mode === "live") {
    return baseModel;
  }

  return {
    ...baseModel,
    test_delivery_mode: recipient.mode,
    test_original_recipient: recipient.originalTo,
  };
}
