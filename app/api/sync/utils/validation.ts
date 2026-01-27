import mongoose from "mongoose";
import { HandlerResult } from "../types";

const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export function toObjectId(id: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(id);
}

export function validateTimeFormat(time: string): boolean {
  return TIME_REGEX.test(time);
}

export function validateTimeLogic(
  startTime: string,
  endTime: string,
  isFullDay: boolean,
): string | null {
  const startParts = startTime.split(":");
  const endParts = endTime.split(":");

  if (startParts.length !== 2 || endParts.length !== 2) {
    return "Invalid time format";
  }

  const startHour = parseInt(startParts[0] ?? "0", 10);
  const startMin = parseInt(startParts[1] ?? "0", 10);
  const endHour = parseInt(endParts[0] ?? "0", 10);
  const endMin = parseInt(endParts[1] ?? "0", 10);

  const startTimeMinutes = startHour * 60 + startMin;
  const endTimeMinutes = endHour * 60 + endMin;

  if (startTimeMinutes >= endTimeMinutes && !isFullDay) {
    return "Start time must be before end time";
  }
  return null;
}

export function validationError(message: string): HandlerResult {
  return {
    success: false,
    status: 400,
    error: "VALIDATION_ERROR",
    message,
  };
}

export function notFoundError(message: string): HandlerResult {
  return {
    success: false,
    status: 404,
    error: "NOT_FOUND",
    message,
  };
}

export function serverError(message: string): HandlerResult {
  return {
    success: false,
    status: 500,
    error: "SERVER_ERROR",
    message,
  };
}

export function success(data?: Record<string, unknown>): HandlerResult {
  return {
    success: true,
    status: 200,
    data,
  };
}
