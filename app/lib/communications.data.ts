"use server";

import connectMongo from "./connect";
import { Client, Invoice, JobsDueSoon } from "../../models/reactDataSchema";
import {
  isFollowUpDue,
  mapInvoiceCallHistory,
  mapInvoiceEmailDeliveryHistory,
  mapJobsDueSoonCallHistory,
  mapJobsDueSoonEmailHistory,
  mapPaymentReminderHistory,
  normalizeStoredTimestamp,
  sortCommunicationsDescending,
} from "./communications/adapter";
import type {
  CommunicationItem,
  CommunicationRecordRefs,
  CommunicationsContextInput,
  CommunicationsContextPayload,
  JobsDueSoonContextSnapshot,
  UrgentFollowUpItem,
} from "./communications/types";

type LeanClient = {
  _id?: unknown;
  email?: unknown;
  emails?: {
    primary?: unknown;
    accounting?: unknown;
    scheduling?: unknown;
  };
  isArchived?: boolean;
};

type LeanInvoice = {
  _id?: unknown;
  invoiceId?: unknown;
  jobTitle?: unknown;
  clientId?: unknown;
  callHistory?: unknown[];
  paymentReminders?: {
    reminderHistory?: unknown[];
  };
  emailDeliveryHistory?: unknown[];
};

type LeanJobsDueSoon = {
  _id?: unknown;
  invoiceId?: unknown;
  clientId?: unknown;
  jobTitle?: unknown;
  dateDue?: unknown;
  isScheduled?: unknown;
  emailSent?: unknown;
  callHistory?: unknown[];
  emailHistory?: unknown[];
};

const toStringId = (value: unknown): string => {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && value && "toString" in value) {
    return String((value as { toString: () => string }).toString());
  }
  return String(value);
};

const toIsoOrUndefined = (value: unknown): string | undefined =>
  normalizeStoredTimestamp(value) || undefined;

const hasClientEmail = (client: LeanClient | null): boolean => {
  if (!client) return false;
  const emails = [
    client.emails?.primary,
    client.emails?.accounting,
    client.emails?.scheduling,
    client.email,
  ]
    .map((entry) =>
      entry === undefined || entry === null ? "" : String(entry),
    )
    .map((entry) => entry.trim())
    .filter(Boolean);
  return emails.length > 0;
};

const getClientLookupMap = async (
  clientIds: string[],
): Promise<Map<string, LeanClient>> => {
  if (clientIds.length === 0) return new Map();
  const clients = (await Client.find({
    _id: { $in: clientIds },
  })
    .select("_id email emails isArchived")
    .lean()) as LeanClient[];

  return new Map(clients.map((client) => [toStringId(client._id), client]));
};

const buildJobsDueSoonSnapshot = (
  jobsDueSoonDoc: LeanJobsDueSoon,
): JobsDueSoonContextSnapshot => {
  const emailHistory = Array.isArray(jobsDueSoonDoc.emailHistory)
    ? jobsDueSoonDoc.emailHistory
        .map((entry: any) => {
          const sentAt = toIsoOrUndefined(entry?.sentAt);
          if (!sentAt) return null;
          return {
            sentAt,
            recipient: String(entry?.recipient || ""),
            includeSchedulingLink: Boolean(entry?.includeSchedulingLink),
            templateAlias: entry?.templateAlias
              ? String(entry.templateAlias)
              : undefined,
            messageStream: entry?.messageStream
              ? String(entry.messageStream)
              : undefined,
            performedBy: entry?.performedBy
              ? String(entry.performedBy)
              : undefined,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    : [];

  return {
    jobsDueSoonId: toStringId(jobsDueSoonDoc._id),
    invoiceId: toStringId(jobsDueSoonDoc.invoiceId),
    clientId: toStringId(jobsDueSoonDoc.clientId),
    jobTitle: String(jobsDueSoonDoc.jobTitle || ""),
    dateDue: toIsoOrUndefined(jobsDueSoonDoc.dateDue),
    isScheduled: Boolean(jobsDueSoonDoc.isScheduled),
    emailSent: Boolean(jobsDueSoonDoc.emailSent),
    emailHistory,
  };
};

const makeEmptyContextPayload = (
  contextType: "invoice" | "jobsDueSoon",
): CommunicationsContextPayload => ({
  contextType,
  title: "Unknown Record",
  refs: {},
  emailExists: false,
  items: [],
});

export async function getCommunicationsForContext(
  input: CommunicationsContextInput,
): Promise<CommunicationsContextPayload> {
  await connectMongo();

  if (input.contextType === "invoice") {
    const invoiceDoc = (await Invoice.findById(input.invoiceId)
      .select(
        "_id invoiceId jobTitle clientId callHistory paymentReminders.reminderHistory emailDeliveryHistory",
      )
      .lean()) as LeanInvoice | null;

    if (!invoiceDoc) {
      return makeEmptyContextPayload("invoice");
    }

    const invoiceMongoId = toStringId(invoiceDoc._id);
    const clientId = toStringId(invoiceDoc.clientId);
    const refs: CommunicationRecordRefs = {
      invoiceId: invoiceMongoId,
      clientId,
    };

    const clientDoc = (await Client.findById(clientId)
      .select("_id email emails")
      .lean()) as LeanClient | null;

    const items = sortCommunicationsDescending([
      ...mapInvoiceCallHistory(invoiceDoc.callHistory as any[], refs),
      ...mapPaymentReminderHistory(
        invoiceDoc.paymentReminders?.reminderHistory as any[],
        refs,
      ),
      ...mapInvoiceEmailDeliveryHistory(
        invoiceDoc.emailDeliveryHistory as any[],
        refs,
      ),
    ]);

    return {
      contextType: "invoice",
      title: String(invoiceDoc.jobTitle || `Invoice ${invoiceDoc.invoiceId}`),
      refs: {
        ...refs,
        invoiceNumber: String(invoiceDoc.invoiceId || ""),
      },
      emailExists: hasClientEmail(clientDoc),
      items,
    };
  }

  const jobsDueSoonDoc = input.jobsDueSoonId
    ? ((await JobsDueSoon.findById(input.jobsDueSoonId)
        .select(
          "_id invoiceId clientId jobTitle dateDue isScheduled emailSent callHistory emailHistory",
        )
        .lean()) as LeanJobsDueSoon | null)
    : ((await JobsDueSoon.findOne({ invoiceId: input.invoiceId })
        .select(
          "_id invoiceId clientId jobTitle dateDue isScheduled emailSent callHistory emailHistory",
        )
        .lean()) as LeanJobsDueSoon | null);

  if (!jobsDueSoonDoc) {
    return makeEmptyContextPayload("jobsDueSoon");
  }

  const jobsDueSoonId = toStringId(jobsDueSoonDoc._id);
  const invoiceMongoId = toStringId(jobsDueSoonDoc.invoiceId);
  const clientId = toStringId(jobsDueSoonDoc.clientId);
  const refs: CommunicationRecordRefs = {
    jobsDueSoonId,
    invoiceId: invoiceMongoId,
    clientId,
  };

  const [clientDoc, invoiceMeta] = await Promise.all([
    Client.findById(clientId)
      .select("_id email emails")
      .lean() as Promise<LeanClient | null>,
    Invoice.findById(invoiceMongoId).select("invoiceId").lean() as Promise<{
      invoiceId?: unknown;
    } | null>,
  ]);

  const items = sortCommunicationsDescending([
    ...mapJobsDueSoonCallHistory(jobsDueSoonDoc.callHistory as any[], refs),
    ...mapJobsDueSoonEmailHistory(jobsDueSoonDoc.emailHistory as any[], refs),
  ]);

  return {
    contextType: "jobsDueSoon",
    title: String(jobsDueSoonDoc.jobTitle || "Jobs Due Soon"),
    refs: {
      ...refs,
      invoiceNumber: String(invoiceMeta?.invoiceId || ""),
    },
    emailExists: hasClientEmail(clientDoc),
    jobsDueSoon: buildJobsDueSoonSnapshot(jobsDueSoonDoc),
    items,
  };
}

const toUrgentFollowUpItem = (
  item: CommunicationItem,
  title: string,
): UrgentFollowUpItem | null => {
  if (!item.followUpDate) return null;

  const detailsOutcome =
    typeof item.details?.outcomeLabel === "string"
      ? item.details.outcomeLabel
      : item.summary;
  const hrefInvoiceId = item.refs.invoiceId || "";

  return {
    id: `${item.source}:${item.id}`,
    source: item.source,
    title,
    latestOutcome: detailsOutcome,
    followUpDate: item.followUpDate,
    contextBadge: item.source === "invoice" ? "Invoice" : "Jobs",
    href: hrefInvoiceId ? `/invoices/${hrefInvoiceId}` : "/dashboard",
    refs: item.refs,
  };
};

const pickLatestDueFollowUpCall = (
  calls: CommunicationItem[],
  todayDatePart: string,
): CommunicationItem | null => {
  const dueCalls = calls.filter(
    (call) =>
      (call.type === "call_payment" || call.type === "call_scheduling") &&
      isFollowUpDue(call.followUpDate, todayDatePart),
  );
  if (dueCalls.length === 0) return null;

  return (
    [...dueCalls].sort((a, b) => {
      const followUpDateA = a.followUpDate || "";
      const followUpDateB = b.followUpDate || "";
      const followUpDateCompare = followUpDateB.localeCompare(followUpDateA);
      if (followUpDateCompare !== 0) return followUpDateCompare;
      return b.timestamp.localeCompare(a.timestamp);
    })[0] || null
  );
};

export async function getUrgentFollowUpItems(): Promise<UrgentFollowUpItem[]> {
  await connectMongo();

  const [invoiceDocs, jobsDocs] = await Promise.all([
    Invoice.find({
      status: { $ne: "paid" },
      "callHistory.followUpDate": { $exists: true, $ne: null },
    })
      .select("_id invoiceId clientId jobTitle callHistory")
      .lean() as Promise<LeanInvoice[]>,
    JobsDueSoon.find({
      isScheduled: false,
      "callHistory.followUpDate": { $exists: true, $ne: null },
    })
      .select("_id invoiceId clientId jobTitle callHistory")
      .lean() as Promise<LeanJobsDueSoon[]>,
  ]);

  const clientIds = [
    ...new Set(
      [...invoiceDocs, ...jobsDocs]
        .map((doc) => toStringId(doc.clientId))
        .filter(Boolean),
    ),
  ];
  const clientLookup = await getClientLookupMap(clientIds);
  const todayDatePart = new Date().toISOString().split("T")[0] || "";

  const invoiceFollowUps = invoiceDocs.flatMap((invoiceDoc) => {
    const invoiceId = toStringId(invoiceDoc._id);
    const clientId = toStringId(invoiceDoc.clientId);
    const client = clientLookup.get(clientId) || null;
    if (client?.isArchived) return [];

    const refs: CommunicationRecordRefs = { invoiceId, clientId };
    const latestDueFollowUp = pickLatestDueFollowUpCall(
      mapInvoiceCallHistory(invoiceDoc.callHistory as any[], refs),
      todayDatePart,
    );
    if (!latestDueFollowUp) return [];

    const item = toUrgentFollowUpItem(
      latestDueFollowUp,
      String(invoiceDoc.jobTitle || `Invoice ${invoiceDoc.invoiceId || ""}`),
    );
    return item ? [item] : [];
  });

  const jobsFollowUps = jobsDocs.flatMap((jobDoc) => {
    const jobsDueSoonId = toStringId(jobDoc._id);
    const invoiceId = toStringId(jobDoc.invoiceId);
    const clientId = toStringId(jobDoc.clientId);
    const client = clientLookup.get(clientId) || null;
    if (client?.isArchived) return [];

    const refs: CommunicationRecordRefs = {
      jobsDueSoonId,
      invoiceId,
      clientId,
    };
    const latestDueFollowUp = pickLatestDueFollowUpCall(
      mapJobsDueSoonCallHistory(jobDoc.callHistory as any[], refs),
      todayDatePart,
    );
    if (!latestDueFollowUp) return [];

    const item = toUrgentFollowUpItem(
      latestDueFollowUp,
      String(jobDoc.jobTitle || "Jobs Due Soon"),
    );
    return item ? [item] : [];
  });

  return [...invoiceFollowUps, ...jobsFollowUps].sort((a, b) => {
    const followUpCompare = a.followUpDate.localeCompare(b.followUpDate);
    if (followUpCompare !== 0) return followUpCompare;
    return a.title.localeCompare(b.title);
  });
}
