import { auth } from "@clerk/nextjs/server";

const isManagerClaim = (sessionClaims: unknown): boolean => {
  const claims = sessionClaims as {
    isManager?: { isManager?: boolean };
    metadata?: { isManager?: boolean };
  };

  return (
    claims?.isManager?.isManager === true || claims?.metadata?.isManager === true
  );
};

export async function requireUserId() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    throw new Error("Unauthorized: Authentication required");
  }

  return { userId, sessionClaims };
}

export async function requireAdmin() {
  const { userId, sessionClaims } = await requireUserId();

  if (!isManagerClaim(sessionClaims)) {
    throw new Error("Unauthorized: Manager access required");
  }

  return { userId, sessionClaims };
}
