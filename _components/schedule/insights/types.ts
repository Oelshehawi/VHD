"use client";

import type { ScheduleType } from "../../../app/lib/typeDefinitions";

export type MoveJobOptionWithDetails = Pick<
  ScheduleType,
  | "_id"
  | "jobTitle"
  | "location"
  | "startDateTime"
  | "assignedTechnicians"
  | "hours"
  | "technicianNotes"
  | "onSiteContact"
  | "accessInstructions"
>;
