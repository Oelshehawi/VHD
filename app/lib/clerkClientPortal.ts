"use server";

import { clerkClient } from "@clerk/nextjs/server";
import * as crypto from "crypto";
import { getBaseUrl } from "./utils";
import { Client } from "@/models";

/**
 * Generate a cryptographically secure access token
 */
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate a client access link using Clerk's email magic link
 * @param clientId - The client's ID in the database
 * @param clientName - The client's name for display purposes
 * @param clientEmail - The client's email address
 * @returns A URL that clients can use to sign in to the portal
 */
export async function generateClientAccessLink(
  clientId: string,
  clientName: string,
  clientEmail: string,
) {
  try {
    const clerk = await clerkClient();

    // Check if user exists with this email
    const existingUsers = await clerk.users.getUserList({
      emailAddress: [clientEmail],
    });

    let userId: string;

    if (existingUsers.data.length > 0 && existingUsers.data[0]) {
      // Use existing user
      userId = existingUsers.data[0].id;

      // Update publicMetadata to ensure it has correct client information
      await clerk.users.updateUser(userId, {
        publicMetadata: {
          isClientPortalUser: true,
          clientId,
          clientName,
        },
      });
    } else {
      // Create a new user for this client
      const newUser = await clerk.users.createUser({
        emailAddress: [clientEmail],
        publicMetadata: {
          isClientPortalUser: true,
          clientId,
          clientName,
        },
        skipPasswordRequirement: true,
        firstName: clientName,
      });
      userId = newUser.id;
    }

    // Generate a secure access token with 30-day expiry
    const accessToken = generateSecureToken();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // Store the token and Clerk userId in the Client document
    await Client.findByIdAndUpdate(clientId, {
      portalAccessToken: accessToken,
      portalAccessTokenExpiry: expiryDate,
      clerkUserId: userId,
    });

    // Create the reusable access URL with secure token
    const accessUrl = new URL("/acceptToken", getBaseUrl());
    accessUrl.searchParams.set("clientId", clientId);
    accessUrl.searchParams.set("accessToken", accessToken);

    return {
      success: true,
      magicLink: accessUrl.toString(),
    };
  } catch (error) {
    console.error("Error generating client access link:", error);
    throw new Error("Failed to generate client access link");
  }
}

/**
 * Generate a fresh client token for an existing client user
 * Uses secure token validation and efficient email-based Clerk lookup
 * @param clientId - The client's ID in the database
 * @param accessToken - The secure access token from the URL
 * @returns A fresh sign-in token for the client
 */
export async function generateFreshClientToken(
  clientId: string,
  accessToken: string,
) {
  try {
    if (!clientId) {
      throw new Error("Client ID is required");
    }
    if (!accessToken || accessToken.trim().length === 0) {
      throw new Error("Invalid access token");
    }

    // Look up the client from database
    const client = await Client.findById(clientId);

    if (!client) {
      throw new Error("Client not found");
    }

    if (!client.portalAccessToken) {
      throw new Error("Invalid access token");
    }

    const storedHash = crypto
      .createHash("sha256")
      .update(client.portalAccessToken, "utf8")
      .digest();
    const providedHash = crypto
      .createHash("sha256")
      .update(accessToken, "utf8")
      .digest();

    if (!crypto.timingSafeEqual(storedHash, providedHash)) {
      throw new Error("Invalid access token");
    }

    if (
      client.portalAccessTokenExpiry &&
      new Date() > new Date(client.portalAccessTokenExpiry)
    ) {
      throw new Error("Access token has expired");
    }

    const clerk = await clerkClient();
    let clerkUserId = client.clerkUserId;

    // If we have cached Clerk userId, verify it still exists
    if (clerkUserId) {
      try {
        const user = await clerk.users.getUser(clerkUserId);
        // Verify user still has correct metadata
        const metadata = user.publicMetadata as {
          isClientPortalUser?: boolean;
          clientId?: string;
        };
        if (
          !metadata?.isClientPortalUser ||
          metadata?.clientId !== clientId
        ) {
          clerkUserId = undefined; // Force email lookup
        }
      } catch {
        // User no longer exists, clear cached ID
        clerkUserId = undefined;
      }
    }

    // If no cached userId, look up by email (scalable approach)
    if (!clerkUserId) {
      const clientEmail = client.emails?.primary || client.email;

      if (!clientEmail) {
        throw new Error("Client has no email address configured");
      }

      const users = await clerk.users.getUserList({
        emailAddress: [clientEmail],
      });

      const clientUser = users.data.find(
        (user) =>
          user.publicMetadata &&
          (user.publicMetadata as { isClientPortalUser?: boolean })
            .isClientPortalUser === true &&
          (user.publicMetadata as { clientId?: string }).clientId === clientId,
      );

      if (!clientUser) {
        throw new Error(
          "Client not found or not authorized for portal access",
        );
      }

      clerkUserId = clientUser.id;

      // Cache the userId for future lookups
      await Client.findByIdAndUpdate(clientId, {
        clerkUserId: clerkUserId,
      });
    }

    // Create a fresh sign-in token for the user
    const signInToken = await clerk.signInTokens.createSignInToken({
      userId: clerkUserId,
      expiresInSeconds: 5 * 60, // 5 minutes for security (short-lived)
    });

    return {
      success: true,
      token: signInToken.token,
    };
  } catch (error) {
    console.error("Error generating fresh client token:", error);
    throw new Error("Failed to generate access token");
  }
}
