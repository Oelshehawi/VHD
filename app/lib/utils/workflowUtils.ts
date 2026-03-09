import { ClientType } from "../typeDefinitions";

export function getPortalMode(
  client: ClientType | null | undefined,
): "internal" | "external" | "none" {
  return client?.workflowProfile?.portalMode || "internal";
}

export function isClientPortalEnabled(
  client: ClientType | null | undefined,
): boolean {
  return getPortalMode(client) !== "none";
}

export function isExternalPortalClient(
  client: ClientType | null | undefined,
): boolean {
  return getPortalMode(client) === "external";
}

export function getExternalPortalNotes(
  client: ClientType | null | undefined,
): string {
  return client?.workflowProfile?.externalPortalNotes?.trim() || "";
}

export function isResidentialWorkItem(
  item: { businessType?: "commercial" | "residential" } | null | undefined,
): boolean {
  return item?.businessType === "residential";
}
