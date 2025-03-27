import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function testDatabase() {
  try {
    // Try to create a test user
    const [testUser] = await db
      .insert(users)
      .values({
        username: "testuser",
        password: "testpassword", // In production, this should be hashed
        displayName: "Test User",
      })
      .returning();

    console.log("Test user created:", testUser);

    // Try to fetch the user
    const [fetchedUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, "testuser"));

    console.log("Fetched user:", fetchedUser);

    // Clean up - delete the test user
    await db.delete(users).where(eq(users.username, "testuser"));
    console.log("Test user deleted");

    console.log("Database connection test successful!");
  } catch (error) {
    console.error("Database test failed:", error);
  }
}

testDatabase(); 