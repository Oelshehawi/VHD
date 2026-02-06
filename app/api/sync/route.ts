import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectMongo from "../../lib/connect";
import { SyncRequest } from "./types";
import { getHandler, supportedTables } from "./handlers";

// TEMP DEBUG: Remove after mobile sync queues are healthy in production.
function logSyncValidationFailure(
  method: string,
  reason: string,
  body?: SyncRequest | null,
) {
  console.warn("[sync] validation failure", {
    method,
    reason,
    table: body?.table ?? null,
    id:
      body?.data &&
      typeof body.data === "object" &&
      !Array.isArray(body.data) &&
      "id" in body.data &&
      typeof body.data.id === "string"
        ? body.data.id
        : null,
    ids: extractRecordIds(body),
  });
}

function extractRecordId(body?: SyncRequest | null): string | null {
  return body?.data &&
    typeof body.data === "object" &&
    !Array.isArray(body.data) &&
    "id" in body.data &&
    typeof body.data.id === "string"
    ? body.data.id
    : null;
}

function extractRecordIds(body?: SyncRequest | null): string[] | null {
  if (!body?.data || typeof body.data !== "object") {
    return null;
  }

  if (Array.isArray(body.data)) {
    const ids = body.data
      .map((item) =>
        item &&
        typeof item === "object" &&
        "id" in item &&
        typeof item.id === "string"
          ? item.id
          : null,
      )
      .filter((id): id is string => Boolean(id));
    return ids.length > 0 ? ids : null;
  }

  if ("photos" in body.data && Array.isArray(body.data.photos)) {
    const ids = body.data.photos
      .map((item) =>
        item &&
        typeof item === "object" &&
        "id" in item &&
        typeof item.id === "string"
          ? item.id
          : null,
      )
      .filter((id): id is string => Boolean(id));
    return ids.length > 0 ? ids : null;
  }

  const id = extractRecordId(body);
  return id ? [id] : null;
}

function isRecordData(
  data: SyncRequest["data"],
): data is Record<string, unknown> {
  return !Array.isArray(data);
}

function toSyncHttpStatus(status: number): number {
  if (status >= 500 || status === 429 || status === 401 || status === 403) {
    return status;
  }

  // TEMP POWERSYNC COMPAT: Validation/conflict style failures should be 2xx
  // so they are acknowledged and don't block/retry in upload queues.
  return 200;
}

function syncJson(
  method: string,
  body: SyncRequest | null,
  payload: {
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
    message?: string;
    status: number;
  },
) {
  const httpStatus = toSyncHttpStatus(payload.status);
  const responseBody = {
    success: payload.success,
    ...(payload.data && { data: payload.data }),
    ...(payload.error && { error: payload.error }),
    ...(payload.message && { message: payload.message }),
  };

  const logPayload = {
    method,
    table: body?.table ?? null,
    id: extractRecordId(body),
    ids: extractRecordIds(body),
    success: payload.success,
    handlerStatus: payload.status,
    httpStatus,
    error: payload.error ?? null,
    message: payload.message ?? null,
  };

  if (httpStatus >= 500 || httpStatus === 429) {
    console.error("[sync] result", logPayload);
  } else if (!payload.success) {
    console.warn("[sync] result", logPayload);
  } else {
    console.info("[sync] result", logPayload);
  }

  return NextResponse.json(responseBody, { status: httpStatus });
}

function unauthorizedSyncResponse(method: string) {
  const payload = {
    success: false,
    error: "UNAUTHORIZED",
    message: "Unauthorized",
    status: 401,
  };
  console.warn("[sync] result", {
    method,
    table: null,
    id: null,
    ids: null,
    success: false,
    handlerStatus: payload.status,
    httpStatus: payload.status,
    error: payload.error,
    message: payload.message,
  });
  return NextResponse.json(
    {
      success: false,
      error: payload.error,
      message: payload.message,
    },
    { status: payload.status },
  );
}

async function parseRequest(
  request: NextRequest,
): Promise<{ data: SyncRequest | null; error: string | null }> {
  try {
    const body = (await request.json()) as SyncRequest;

    if (!body.table) {
      return { data: null, error: "table is required" };
    }

    if (!supportedTables.includes(body.table)) {
      return {
        data: null,
        error: `Invalid table. Supported: ${supportedTables.join(", ")}`,
      };
    }

    if (!body.data || typeof body.data !== "object") {
      return { data: null, error: "data object is required" };
    }

    return { data: body, error: null };
  } catch {
    return { data: null, error: "Invalid JSON body" };
  }
}

export async function PUT(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return unauthorizedSyncResponse("PUT");
  }

  const { data: body, error: parseError } = await parseRequest(request);
  if (parseError || !body) {
    logSyncValidationFailure("PUT", parseError ?? "Invalid request body", body);
    return syncJson("PUT", body, {
      success: false,
      error: "VALIDATION_ERROR",
      message: parseError ?? "Invalid request body",
      status: 400,
    });
  }

  await connectMongo();

  if (!isRecordData(body.data)) {
    logSyncValidationFailure("PUT", "data object is required", body);
    return syncJson("PUT", body, {
      success: false,
      error: "VALIDATION_ERROR",
      message: "data object is required",
      status: 400,
    });
  }

  const handler = getHandler(body.table);
  if (!handler) {
    logSyncValidationFailure("PUT", "Unknown table", body);
    return syncJson("PUT", body, {
      success: false,
      error: "VALIDATION_ERROR",
      message: "Unknown table",
      status: 400,
    });
  }

  const result = await handler.put(body.data);

  return syncJson("PUT", body, result);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return unauthorizedSyncResponse("POST");
  }

  const { data: body, error: parseError } = await parseRequest(request);
  if (parseError || !body) {
    logSyncValidationFailure(
      "POST",
      parseError ?? "Invalid request body",
      body,
    );
    return syncJson("POST", body, {
      success: false,
      error: "VALIDATION_ERROR",
      message: parseError ?? "Invalid request body",
      status: 400,
    });
  }

  await connectMongo();

  const handler = getHandler(body.table);
  if (!handler) {
    logSyncValidationFailure("POST", "Unknown table", body);
    return syncJson("POST", body, {
      success: false,
      error: "VALIDATION_ERROR",
      message: "Unknown table",
      status: 400,
    });
  }

  const result = await handler.batchPut(body.data as Record<string, unknown>);

  return syncJson("POST", body, result);
}

export async function PATCH(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return unauthorizedSyncResponse("PATCH");
  }

  const { data: body, error: parseError } = await parseRequest(request);
  if (parseError || !body) {
    logSyncValidationFailure(
      "PATCH",
      parseError ?? "Invalid request body",
      body,
    );
    return syncJson("PATCH", body, {
      success: false,
      error: "VALIDATION_ERROR",
      message: parseError ?? "Invalid request body",
      status: 400,
    });
  }

  await connectMongo();

  if (!isRecordData(body.data) && body.table !== "photos") {
    logSyncValidationFailure("PATCH", "data object is required", body);
    return syncJson("PATCH", body, {
      success: false,
      error: "VALIDATION_ERROR",
      message: "data object is required",
      status: 400,
    });
  }

  const handler = getHandler(body.table);
  if (!handler) {
    logSyncValidationFailure("PATCH", "Unknown table", body);
    return syncJson("PATCH", body, {
      success: false,
      error: "VALIDATION_ERROR",
      message: "Unknown table",
      status: 400,
    });
  }

  const isPhotoBatchPayload =
    body.table === "photos" &&
    (Array.isArray(body.data) ||
      (typeof body.data === "object" && Array.isArray(body.data.photos)));

  if (isPhotoBatchPayload) {
    if (!handler.batchPatch) {
      logSyncValidationFailure("PATCH", "batchPatch is not supported", body);
      return syncJson("PATCH", body, {
        success: false,
        error: "VALIDATION_ERROR",
        message: "batchPatch is not supported",
        status: 400,
      });
    }

    const batchData = Array.isArray(body.data)
      ? body.data
      : (body.data.photos as Record<string, unknown>[]);

    const result = await handler.batchPatch(batchData);

    return syncJson("PATCH", body, result);
  }

  if (!isRecordData(body.data)) {
    logSyncValidationFailure("PATCH", "data object is required", body);
    return syncJson("PATCH", body, {
      success: false,
      error: "VALIDATION_ERROR",
      message: "data object is required",
      status: 400,
    });
  }

  const result = await handler.patch(body.data);

  return syncJson("PATCH", body, result);
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return unauthorizedSyncResponse("DELETE");
  }

  const { data: body, error: parseError } = await parseRequest(request);
  if (parseError || !body) {
    logSyncValidationFailure(
      "DELETE",
      parseError ?? "Invalid request body",
      body,
    );
    return syncJson("DELETE", body, {
      success: false,
      error: "VALIDATION_ERROR",
      message: parseError ?? "Invalid request body",
      status: 400,
    });
  }

  if (!isRecordData(body.data)) {
    logSyncValidationFailure("DELETE", "data object is required", body);
    return syncJson("DELETE", body, {
      success: false,
      error: "VALIDATION_ERROR",
      message: "data object is required",
      status: 400,
    });
  }

  const id = body.data.id;
  if (!id || typeof id !== "string") {
    logSyncValidationFailure("DELETE", "id is required", body);
    return syncJson("DELETE", body, {
      success: false,
      error: "VALIDATION_ERROR",
      message: "id is required",
      status: 400,
    });
  }

  await connectMongo();

  const handler = getHandler(body.table);
  if (!handler) {
    logSyncValidationFailure("DELETE", "Unknown table", body);
    return syncJson("DELETE", body, {
      success: false,
      error: "VALIDATION_ERROR",
      message: "Unknown table",
      status: 400,
    });
  }

  const result = await handler.delete(id);

  return syncJson("DELETE", body, result);
}
