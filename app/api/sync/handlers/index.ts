import { SyncTable, TableHandler } from "../types";
import { schedulesHandler } from "./schedules.handler";
import { invoicesHandler } from "./invoices.handler";
import { photosHandler } from "./photos.handler";
import { availabilitiesHandler } from "./availabilities.handler";
import { timeOffRequestsHandler } from "./timeoffrequests.handler";
import { payrollPeriodsHandler } from "./payrollperiods.handler";

const handlers: Record<SyncTable, TableHandler> = {
  schedules: schedulesHandler,
  invoices: invoicesHandler,
  photos: photosHandler,
  availabilities: availabilitiesHandler,
  timeoffrequests: timeOffRequestsHandler,
  payrollperiods: payrollPeriodsHandler,
};

export function getHandler(table: string): TableHandler | null {
  return handlers[table as SyncTable] ?? null;
}

export const supportedTables = Object.keys(handlers) as SyncTable[];
