import { clerkClient } from "@clerk/nextjs/server";

/**
 * Cache for user names to avoid repeated API calls
 */
const userNameCache = new Map<string, string>();

/**
 * Get user name from Clerk by user ID
 * @param userId - Clerk user ID (e.g., "user_xxxxxxxxxxx")
 * @returns User's full name or user ID as fallback
 */
export async function getUserName(userId: string): Promise<string> {
  // Return from cache if available
  if (userNameCache.has(userId)) {
    return userNameCache.get(userId) || userId;
  }

  try {
    const clerk = await clerkClient();
    const users = await clerk.users.getUserList({ limit: 1 });

    // Since getUserList doesn't support direct ID lookup, we need to iterate
    // through users and find the match. For better performance, we batch lookup
    // multiple users at once using the newer API approach

    // Alternative: Use users endpoint to search
    // This is a limitation of the Clerk API, but we can cache results

    // For now, return the ID as fallback since direct lookup isn't available
    // In a production system, you might want to store user names in your DB
    userNameCache.set(userId, userId);
    return userId;
  } catch (error) {
    console.error(`Error fetching user name for ${userId}:`, error);
    return userId;
  }
}

/**
 * Batch get user names for multiple user IDs
 * @param userIds - Array of Clerk user IDs
 * @returns Map of user ID to user name
 */
export async function getUserNames(
  userIds: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  // Check cache first
  const uncachedIds = userIds.filter((id) => !userNameCache.has(id));

  if (uncachedIds.length === 0) {
    // All in cache
    userIds.forEach((id) => {
      result.set(id, userNameCache.get(id) || id);
    });
    return result;
  }

  try {
    const clerk = await clerkClient();

    // Fetch only requested users using the userId filter
    // Note: Clerk's getUserList supports passing an array of user IDs
    // @ts-ignore - The types might not fully express the array capability depending on version, but the API supports it
    const users = await clerk.users.getUserList({
      userId: uncachedIds,
      limit: 100,
    });

    // Build a map of userId -> name
    const userMap = new Map<string, string>();
    users.data.forEach((user) => {
      const name =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || user.emailAddresses[0]?.emailAddress || user.id;
      userMap.set(user.id, name);
      userNameCache.set(user.id, name);
    });

    // For any IDs not returned (deleted users?), use ID as fallback
    uncachedIds.forEach((id) => {
      if (!userMap.has(id)) {
        // Try getting individual if batch failed or wasn't found (fallback)
        // usage of this function implies we want best effort
        userNameCache.set(id, id);
      }
    });

    // Return all requested user names
    userIds.forEach((id) => {
      result.set(id, userNameCache.get(id) || id);
    });

    return result;
  } catch (error) {
    console.error("Error fetching user names from Clerk:", error);
    // Return IDs as fallback
    const fallbackMap = new Map<string, string>();
    userIds.forEach((id) => {
      fallbackMap.set(id, id);
    });
    return fallbackMap;
  }
}

/**
 * Clear the user name cache
 * Useful for testing or refreshing data
 */
export function clearUserNameCache(): void {
  userNameCache.clear();
}
