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

    // Create a sign-in token for the user
    const signInToken = await clerk.signInTokens.createSignInToken({
      userId,
      expiresInSeconds: 7 * 24 * 60 * 60, // 7 days
    });

    // Create the access URL with the token
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://vhd-psi.vercel.app";

    const accessUrl = new URL("/acceptToken", baseUrl);
    accessUrl.searchParams.set("client_token", signInToken.token);

    return {
      success: true,
      magicLink: accessUrl.toString(),
    };
  } catch (error) {
    console.error("Error generating client access link:", error);
    throw new Error("Failed to generate client access link");
  }
}

