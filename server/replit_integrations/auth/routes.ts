import type { Express } from "express";
import { isAuthenticated } from "./replitAuth";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      res.json({
        id: user.id || "admin",
        email: user.claims?.email || "admin@kairos.local",
        firstName: user.claims?.first_name || "Admin",
        lastName: user.claims?.last_name || "",
        profileImageUrl: null,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
