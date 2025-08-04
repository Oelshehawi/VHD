"use server";

import { clerkClient } from "@clerk/nextjs/server";

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

    // Create the reusable access URL using acceptToken with clientId
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://vhd-psi.vercel.app";

    const accessUrl = new URL("/acceptToken", baseUrl);
    accessUrl.searchParams.set("clientId", clientId);

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
 * @param clientId - The client's ID in the database
 * @returns A fresh sign-in token for the client
 */
export async function generateFreshClientToken(clientId: string) {
  try {
    if (!clientId) {
      throw new Error("Client ID is required");
    }

    const clerk = await clerkClient();

    // Find user by clientId in metadata
    const users = await clerk.users.getUserList({
      limit: 100, // Adjust if you have more than 100 clients
    });

    const clientUser = users.data.find(
      (user) => 
        user.publicMetadata &&
        (user.publicMetadata as any).isClientPortalUser === true &&
        (user.publicMetadata as any).clientId === clientId
    );

    if (!clientUser) {
      throw new Error("Client not found or not authorized for portal access");
    }

    // Create a fresh sign-in token for the user
    const signInToken = await clerk.signInTokens.createSignInToken({
      userId: clientUser.id,
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

