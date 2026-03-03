import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import connectMongo from "../../../lib/connect";
import { formatDateStringUTC } from "../../../lib/utils";
import {
  AuditLog,
  SchedulingRequest,
} from "../../../../models/reactDataSchema";
import { Notification } from "../../../../models/notificationSchema";
import {
  NOTIFICATION_TYPES,
  RequestedTime,
  SchedulingRequestType,
} from "../../../lib/typeDefinitions";

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const ALTERNATIVE_LINK_ARMING_DELAY_SECONDS = () =>
  parsePositiveInt(process.env.SCHEDULING_ALT_LINK_ARMING_DELAY_SECONDS, 5);

const formatRequestedTime = (time?: RequestedTime | null) => {
  if (!time) return "Unknown time";
  const period = time.hour >= 12 ? "PM" : "AM";
  const displayHour = time.hour % 12 || 12;
  return `${displayHour}:${String(time.minute).padStart(2, "0")} ${period}`;
};

const getSelectedOptionDetails = (
  selectedAlternative?: SchedulingRequestType["selectedAlternative"],
): string[] | undefined => {
  if (!selectedAlternative) return undefined;
  return [
    `Selected Option: ${selectedAlternative.optionIndex}`,
    `Date: ${formatDateStringUTC(selectedAlternative.date)}`,
    `Time: ${formatRequestedTime(selectedAlternative.requestedTime)}`,
  ];
};

const isLikelyHumanRequest = (request: NextRequest) => {
  const accept = request.headers.get("accept") || "";
  const secFetchUser = request.headers.get("sec-fetch-user") || "";
  const userAgent = (request.headers.get("user-agent") || "").toLowerCase();
  const scannerPattern =
    /(bot|crawler|spider|proofpoint|mimecast|barracuda|safelinks|microsoft office|defender|urlscan|curl|wget|python-requests|headless)/i;

  return (
    accept.includes("text/html") &&
    secFetchUser === "?1" &&
    !scannerPattern.test(userAgent)
  );
};

const renderPage = ({
  status,
  title,
  body,
  variant = "neutral",
  details,
  ctaLabel,
  ctaHref,
  showPostConfirm,
  params,
}: {
  status: number;
  title: string;
  body: string;
  variant?: "success" | "warning" | "error" | "neutral";
  details?: string[];
  ctaLabel?: string;
  ctaHref?: string;
  showPostConfirm?: boolean;
  params?: {
    rid: string;
    opt: 1 | 2;
    tid: string;
    exp: string;
    sig: string;
  };
}) => {
  const themeByVariant = {
    success: {
      accent: "#0b6b4b",
      soft: "#eaf8f1",
      icon: "✓",
    },
    warning: {
      accent: "#8a5a00",
      soft: "#fff6e8",
      icon: "!",
    },
    error: {
      accent: "#9b1c1c",
      soft: "#fdecec",
      icon: "!",
    },
    neutral: {
      accent: "#003e29",
      soft: "#eef4f2",
      icon: "i",
    },
  } as const;
  const theme = themeByVariant[variant];
  const safeTitle = escapeHtml(title);
  const safeBody = escapeHtml(body);
  const detailsHtml =
    Array.isArray(details) && details.length > 0
      ? `<div class="details">${details
          .map((line) => `<p>${escapeHtml(line)}</p>`)
          .join("")}</div>`
      : "";
  const cta = ctaLabel
    ? `<p class="cta-wrap"><a class="cta" href="${escapeHtml(ctaHref || "#")}">${escapeHtml(ctaLabel)}</a></p>`
    : "";
  const postConfirm =
    showPostConfirm && params
      ? `<form method="POST" action="/api/scheduling/select-alternative" class="cta-wrap">
  <input type="hidden" name="rid" value="${escapeHtml(params.rid)}" />
  <input type="hidden" name="opt" value="${escapeHtml(String(params.opt))}" />
  <input type="hidden" name="tid" value="${escapeHtml(params.tid)}" />
  <input type="hidden" name="exp" value="${escapeHtml(params.exp)}" />
  <input type="hidden" name="sig" value="${escapeHtml(params.sig)}" />
  <button type="submit" class="cta">Confirm Selection</button>
</form>`
      : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <style>
    :root {
      --brand: ${theme.accent};
      --brand-soft: ${theme.soft};
      --bg: #f3f6f5;
      --card: #ffffff;
      --text: #16211d;
      --muted: #4a5a54;
      --line: #d6dfdb;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background:
        radial-gradient(circle at 15% 20%, #e6efeb 0, transparent 40%),
        radial-gradient(circle at 85% 10%, #edf5f1 0, transparent 35%),
        var(--bg);
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      color: var(--text);
      position: relative;
    }
    .watermark {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .watermark::before {
      content: "";
      width: min(72vw, 820px);
      aspect-ratio: 1 / 1;
      background: url("/images/logo.png") center center / contain no-repeat;
      opacity: 0.4;
    }
    .card {
      width: 100%;
      max-width: 620px;
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 26px 24px;
      box-shadow: 0 12px 36px rgba(16, 24, 20, 0.08);
      text-align: center;
      animation: fadeUp 280ms ease-out;
      position: relative;
      z-index: 1;
    }
    .icon {
      width: 62px;
      height: 62px;
      margin: 0 auto 14px;
      border-radius: 999px;
      border: 2px solid var(--brand);
      background: var(--brand-soft);
      color: var(--brand);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 30px;
      font-weight: 700;
      animation: popIn 320ms ease-out;
    }
    h1 {
      margin: 0 0 10px;
      color: var(--brand);
      font-size: 28px;
      line-height: 1.2;
    }
    .body {
      margin: 0;
      color: var(--muted);
      line-height: 1.55;
      font-size: 15px;
    }
    .details {
      margin-top: 16px;
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid #dce7e2;
      background: #f8fbf9;
      text-align: left;
    }
    .details p {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
      color: #294038;
    }
    .details p + p { margin-top: 6px; }
    .cta-wrap {
      margin-top: 18px;
    }
    .cta {
      display: inline-block;
      border: none;
      border-radius: 999px;
      padding: 11px 16px;
      min-width: 180px;
      background: var(--brand);
      color: #fff;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 8px 18px rgba(11, 107, 75, 0.22);
      transition: transform 120ms ease, box-shadow 120ms ease;
    }
    .cta:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 22px rgba(11, 107, 75, 0.28);
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes popIn {
      from { opacity: 0; transform: scale(0.88); }
      to { opacity: 1; transform: scale(1); }
    }
  </style>
</head>
<body>
  <div class="watermark" aria-hidden="true"></div>
  <div class="card">
    <div class="icon">${theme.icon}</div>
    <h1>${safeTitle}</h1>
    <p class="body">${safeBody}</p>
    ${detailsHtml}
    ${postConfirm}
    ${cta}
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
};

const getManagerUserIds = async (): Promise<string[]> => {
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const clerk = await clerkClient();
    const users = await clerk.users.getUserList({ limit: 500 });

    return users.data
      .filter((user) => {
        const metadata = user.publicMetadata as
          | { isManager?: boolean }
          | undefined;
        return metadata?.isManager === true;
      })
      .map((user) => user.id);
  } catch (error) {
    console.error("Failed to get manager IDs:", error);
    return [];
  }
};

const verifySignature = (params: {
  rid: string;
  opt: 1 | 2;
  tid: string;
  exp: string;
  sig: string;
}) => {
  const secret = process.env.SCHEDULING_ALT_LINK_SECRET?.trim();
  if (!secret) {
    return { valid: false, configError: true };
  }

  const payload = `${params.rid}|${params.opt}|${params.tid}|${params.exp}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const sigBuffer = Buffer.from(params.sig);
  const expectedBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expectedBuffer.length) {
    return { valid: false, configError: false };
  }

  return {
    valid: crypto.timingSafeEqual(sigBuffer, expectedBuffer),
    configError: false,
  };
};

const parseParams = async (request: NextRequest) => {
  if (request.method === "POST") {
    const formData = await request.formData();
    return {
      rid: String(formData.get("rid") || ""),
      opt: String(formData.get("opt") || ""),
      tid: String(formData.get("tid") || ""),
      exp: String(formData.get("exp") || ""),
      sig: String(formData.get("sig") || ""),
    };
  }

  const { searchParams } = new URL(request.url);
  return {
    rid: searchParams.get("rid") || "",
    opt: searchParams.get("opt") || "",
    tid: searchParams.get("tid") || "",
    exp: searchParams.get("exp") || "",
    sig: searchParams.get("sig") || "",
  };
};

const handleSelectAlternative = async (
  request: NextRequest,
  requireHumanGate: boolean,
) => {
  const raw = await parseParams(request);
  const optionIndex = Number.parseInt(raw.opt, 10);
  const expUnix = Number.parseInt(raw.exp, 10);

  if (!raw.rid || !raw.tid || !raw.sig || ![1, 2].includes(optionIndex)) {
    return renderPage({
      status: 400,
      title: "Invalid Selection Link",
      body: "This link is missing required details. Please reply to the email and our team will help.",
      variant: "error",
    });
  }

  if (!Number.isFinite(expUnix)) {
    return renderPage({
      status: 400,
      title: "Invalid Selection Link",
      body: "This link is invalid. Please reply to the email and our team will help.",
      variant: "error",
    });
  }

  const expDate = new Date(expUnix * 1000);
  const now = new Date();
  const parsedOptionIndex = optionIndex as 1 | 2;
  if (expDate <= now) {
    return renderPage({
      status: 410,
      title: "Selection Link Expired",
      body: "This link has expired. Please reply to the scheduling email and we will send updated options.",
      variant: "warning",
    });
  }

  const signatureCheck = verifySignature({
    rid: raw.rid,
    opt: parsedOptionIndex,
    tid: raw.tid,
    exp: raw.exp,
    sig: raw.sig,
  });

  if (signatureCheck.configError) {
    return renderPage({
      status: 500,
      title: "Configuration Error",
      body: "This selection link is temporarily unavailable. Please reply to the scheduling email.",
      variant: "error",
    });
  }

  if (!signatureCheck.valid) {
    return renderPage({
      status: 401,
      title: "Invalid Selection Link",
      body: "This link signature is invalid. Please reply to the scheduling email and our team will assist.",
      variant: "error",
    });
  }

  await connectMongo();

  const requestDoc = (await SchedulingRequest.findById(raw.rid)
    .populate("invoiceId", "invoiceId jobTitle")
    .populate("clientId", "clientName")
    .lean()) as SchedulingRequestType | null;

  if (!requestDoc) {
    return renderPage({
      status: 404,
      title: "Request Not Found",
      body: "We could not find this scheduling request. Please reply to the email for help.",
      variant: "error",
    });
  }

  if (requestDoc.status !== "alternatives_sent") {
    const selectedDetails = getSelectedOptionDetails(
      requestDoc.selectedAlternative,
    );
    return renderPage({
      status: 200,
      title: "Selection Already Handled",
      body: "This scheduling request has already been handled. Our team will follow up shortly.",
      variant: "neutral",
      details: selectedDetails,
    });
  }

  const alternatives = Array.isArray(requestDoc.alternativesOffered)
    ? requestDoc.alternativesOffered
    : [];
  const selectedOption = alternatives[parsedOptionIndex - 1];
  if (!selectedOption) {
    return renderPage({
      status: 400,
      title: "Invalid Option",
      body: "This option is no longer available. Please reply to the scheduling email for updated options.",
      variant: "error",
    });
  }

  if (!requestDoc.alternativesSelectionToken) {
    return renderPage({
      status: 401,
      title: "Invalid Selection Link",
      body: "This link is no longer active. Please reply to the scheduling email for a new link.",
      variant: "error",
    });
  }

  if (requestDoc.alternativesSelectionToken !== raw.tid) {
    return renderPage({
      status: 401,
      title: "Invalid Selection Link",
      body: "This link does not match the latest email. Please use the newest message or reply for help.",
      variant: "error",
    });
  }

  const dbExpiry = requestDoc.alternativesSelectionExpiresAt
    ? new Date(requestDoc.alternativesSelectionExpiresAt)
    : null;
  if (!dbExpiry || dbExpiry <= now) {
    return renderPage({
      status: 410,
      title: "Selection Link Expired",
      body: "This link has expired. Please reply to the scheduling email and we will send new options.",
      variant: "warning",
    });
  }

  const armingReference =
    requestDoc.reviewedAt || requestDoc.updatedAt || requestDoc.requestedAt;
  const armingAt = armingReference
    ? new Date(
        new Date(armingReference).getTime() +
          ALTERNATIVE_LINK_ARMING_DELAY_SECONDS() * 1000,
      )
    : null;

  if (armingAt && now < armingAt) {
    return renderPage({
      status: 200,
      title: "Link Activating",
      body: `This link will activate shortly at ${armingAt.toLocaleString("en-US", { hour12: true })}. Please try again in a minute.`,
      variant: "warning",
      ctaLabel: "Retry Link",
      ctaHref: request.url,
    });
  }

  if (requireHumanGate && !isLikelyHumanRequest(request)) {
    return renderPage({
      status: 200,
      title: "Confirm Your Selection",
      body: `Please click below to confirm Option ${optionIndex}.`,
      variant: "neutral",
      details: [
        `Option: ${optionIndex}`,
        `Date: ${formatDateStringUTC(selectedOption.date)}`,
        `Time: ${formatRequestedTime(selectedOption.requestedTime)}`,
      ],
      showPostConfirm: true,
      params: {
        rid: raw.rid,
        opt: parsedOptionIndex,
        tid: raw.tid,
        exp: raw.exp,
        sig: raw.sig,
      },
    });
  }

  const selectedAt = new Date();
  const updated = (await SchedulingRequest.findOneAndUpdate(
    {
      _id: raw.rid,
      status: "alternatives_sent",
      selectedAlternative: { $exists: false },
      alternativesSelectionToken: raw.tid,
      alternativesSelectionExpiresAt: { $gt: selectedAt },
    },
    {
      $set: {
        status: "alternatives_selected",
        selectedAlternative: {
          optionIndex: parsedOptionIndex,
          date: new Date(selectedOption.date),
          requestedTime: selectedOption.requestedTime,
          selectedAt,
          selectedVia: "email_link",
        },
      },
      $unset: {
        alternativesSelectionToken: "",
        alternativesSelectionExpiresAt: "",
      },
    },
    { new: true },
  ).lean()) as SchedulingRequestType | null;

  if (!updated) {
    const latest = (await SchedulingRequest.findById(raw.rid)
      .select("status selectedAlternative")
      .lean()) as SchedulingRequestType | null;

    if (
      latest?.status === "alternatives_selected" ||
      latest?.selectedAlternative
    ) {
      return renderPage({
        status: 200,
        title: "Selection Already Received",
        body: "We already received a selection for this request. Our team will confirm shortly.",
        variant: "neutral",
        details: getSelectedOptionDetails(latest?.selectedAlternative),
      });
    }

    if (
      latest?.status === "confirmed" ||
      latest?.status === "expired" ||
      latest?.status === "cancelled"
    ) {
      return renderPage({
        status: 200,
        title: "Selection Already Handled",
        body: "This scheduling request has already been handled by our team.",
        variant: "neutral",
        details: getSelectedOptionDetails(latest?.selectedAlternative),
      });
    }

    return renderPage({
      status: 409,
      title: "Selection Not Applied",
      body: "We could not apply this selection. Please reply to the scheduling email and we will assist.",
      variant: "warning",
    });
  }

  const invoice = requestDoc.invoiceId as any;
  const client = requestDoc.clientId as any;
  const invoiceIdForAudit = invoice?.invoiceId || String(requestDoc.invoiceId);
  const invoiceMongoId =
    invoice?._id?.toString?.() || String(requestDoc.invoiceId);
  const clientId = client?._id?.toString?.() || String(requestDoc.clientId);
  const jobTitle = invoice?.jobTitle || "Unknown Job";

  try {
    await AuditLog.create({
      invoiceId: invoiceIdForAudit,
      action: "schedule_alternative_selected",
      timestamp: selectedAt,
      performedBy: "system:email_link",
      details: {
        newValue: {
          invoiceId: invoiceIdForAudit,
          invoiceMongoId,
          clientId,
          jobTitle,
          schedulingRequestId: raw.rid,
          optionIndex,
          date: new Date(selectedOption.date).toISOString(),
          requestedTime: selectedOption.requestedTime,
        },
        reason: `Client selected option ${optionIndex} from email link`,
        metadata: {
          clientId,
          jobTitle,
          schedulingRequestId: raw.rid,
        },
      },
      success: true,
    });

    const managerIds = await getManagerUserIds();
    if (managerIds.length > 0) {
      const formattedTime = (() => {
        const hour = selectedOption.requestedTime.hour;
        const minute = selectedOption.requestedTime.minute;
        const period = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
      })();

      await Notification.insertMany(
        managerIds.map((userId) => ({
          userId,
          title: `Client Selected Option ${optionIndex}`,
          body: `${jobTitle} - ${formatDateStringUTC(selectedOption.date)} at ${formattedTime}`,
          type: NOTIFICATION_TYPES.SCHEDULING_REQUEST,
          metadata: {
            schedulingRequestId: raw.rid,
          },
        })),
      );
    }
  } catch (error) {
    console.error(
      "Failed to create alternative-selection audit/notification:",
      error,
    );
  }

  return renderPage({
    status: 200,
    title: "Selection Received",
    body: `Thanks. We received Option ${optionIndex} and our team will confirm your booking shortly.`,
    variant: "success",
    details: [
      `Option: ${optionIndex}`,
      `Date: ${formatDateStringUTC(selectedOption.date)}`,
      `Time: ${formatRequestedTime(selectedOption.requestedTime)}`,
    ],
  });
};

export async function GET(request: NextRequest) {
  return handleSelectAlternative(request, true);
}

export async function POST(request: NextRequest) {
  return handleSelectAlternative(request, false);
}
