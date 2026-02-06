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
      "id" in body.data &&
      typeof body.data.id === "string"
        ? body.data.id
        : null,
  });
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: body, error: parseError } = await parseRequest(request);
  if (parseError || !body) {
    logSyncValidationFailure("PUT", parseError ?? "Invalid request body", body);
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR", message: parseError },
      { status: 400 },
    );
  }

  await connectMongo();

  const handler = getHandler(body.table);
  if (!handler) {
    logSyncValidationFailure("PUT", "Unknown table", body);
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR", message: "Unknown table" },
      { status: 400 },
    );
  }

  const result = await handler.put(body.data);

  return NextResponse.json(
    {
      success: result.success,
      ...(result.data && { data: result.data }),
      ...(result.error && { error: result.error }),
      ...(result.message && { message: result.message }),
    },
    { status: result.status },
  );
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: body, error: parseError } = await parseRequest(request);
  if (parseError || !body) {
    logSyncValidationFailure(
      "POST",
      parseError ?? "Invalid request body",
      body,
    );
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR", message: parseError },
      { status: 400 },
    );
  }

  await connectMongo();

  const handler = getHandler(body.table);
  if (!handler) {
    logSyncValidationFailure("POST", "Unknown table", body);
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR", message: "Unknown table" },
      { status: 400 },
    );
  }

  const result = await handler.batchPut(body.data);

  return NextResponse.json(
    {
      success: result.success,
      ...(result.data && { data: result.data }),
      ...(result.error && { error: result.error }),
      ...(result.message && { message: result.message }),
    },
    { status: result.status },
  );
}

export async function PATCH(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: body, error: parseError } = await parseRequest(request);
  if (parseError || !body) {
    logSyncValidationFailure(
      "PATCH",
      parseError ?? "Invalid request body",
      body,
    );
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR", message: parseError },
      { status: 400 },
    );
  }

  await connectMongo();

  const handler = getHandler(body.table);
  if (!handler) {
    logSyncValidationFailure("PATCH", "Unknown table", body);
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR", message: "Unknown table" },
      { status: 400 },
    );
  }

  const isPhotoBatchPayload =
    body.table === "photos" &&
    (Array.isArray(body.data) ||
      (typeof body.data === "object" && Array.isArray(body.data.photos)));

  if (isPhotoBatchPayload) {
    if (!handler.batchPatch) {
      logSyncValidationFailure("PATCH", "batchPatch is not supported", body);
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          message: "batchPatch is not supported",
        },
        { status: 400 },
      );
    }

    const batchData = Array.isArray(body.data)
      ? body.data
      : (body.data.photos as Record<string, unknown>[]);

    const result = await handler.batchPatch(batchData);

    return NextResponse.json(
      {
        success: result.success,
        ...(result.data && { data: result.data }),
        ...(result.error && { error: result.error }),
        ...(result.message && { message: result.message }),
      },
      { status: result.status },
    );
  }

  const result = await handler.patch(body.data);

  return NextResponse.json(
    {
      success: result.success,
      ...(result.data && { data: result.data }),
      ...(result.error && { error: result.error }),
      ...(result.message && { message: result.message }),
    },
    { status: result.status },
  );
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: body, error: parseError } = await parseRequest(request);
  if (parseError || !body) {
    logSyncValidationFailure(
      "DELETE",
      parseError ?? "Invalid request body",
      body,
    );
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR", message: parseError },
      { status: 400 },
    );
  }

  const id = body.data.id;
  if (!id || typeof id !== "string") {
    logSyncValidationFailure("DELETE", "id is required", body);
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR", message: "id is required" },
      { status: 400 },
    );
  }

  await connectMongo();

  const handler = getHandler(body.table);
  if (!handler) {
    logSyncValidationFailure("DELETE", "Unknown table", body);
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR", message: "Unknown table" },
      { status: 400 },
    );
  }

  const result = await handler.delete(id);

  return NextResponse.json(
    {
      success: result.success,
      ...(result.data && { data: result.data }),
      ...(result.error && { error: result.error }),
      ...(result.message && { message: result.message }),
    },
    { status: result.status },
  );
}
