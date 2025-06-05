// packages/core/src/types/user.types.test.ts
import { Role, User } from "./user.types";

describe("User Types", () => {
  describe("Role Enum", () => {
    it("should have the correct values", () => {
      expect(Role.STUDENT).toBe("STUDENT");
      expect(Role.TEACHER).toBe("TEACHER");
      expect(Role.ADMIN).toBe("ADMIN");
    });

    it("should have exactly three roles", () => {
      const roleValues = Object.values(Role);
      expect(roleValues).toHaveLength(3);
      expect(roleValues).toContain("STUDENT");
      expect(roleValues).toContain("TEACHER");
      expect(roleValues).toContain("ADMIN");
    });
  });

  describe("User Interface", () => {
    it("should be able to create a valid user object", () => {
      const now = new Date();

      const user: User = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        role: Role.STUDENT,
        createdAt: now,
        updatedAt: now,
      };

      expect(user).toBeDefined();
      expect(user.id).toBe(1);
      expect(user.email).toBe("test@example.com");
      expect(user.name).toBe("Test User");
      expect(user.role).toBe(Role.STUDENT);
      expect(user.createdAt).toBe(now);
      expect(user.updatedAt).toBe(now);
    });

    it("should allow name to be null", () => {
      const now = new Date();

      const user: User = {
        id: 1,
        email: "test@example.com",
        name: null,
        role: Role.STUDENT,
        createdAt: now,
        updatedAt: now,
      };

      expect(user).toBeDefined();
      expect(user.name).toBeNull();
    });

    it("should allow name to be undefined", () => {
      const now = new Date();

      const user: User = {
        id: 1,
        email: "test@example.com",
        role: Role.STUDENT,
        createdAt: now,
        updatedAt: now,
      };

      expect(user).toBeDefined();
      expect(user.name).toBeUndefined();
    });

    it("should support admin role", () => {
      const now = new Date();

      const adminUser: User = {
        id: 1,
        email: "admin@example.com",
        name: "Admin User",
        role: Role.ADMIN,
        createdAt: now,
        updatedAt: now,
      };

      expect(adminUser).toBeDefined();
      expect(adminUser.role).toBe(Role.ADMIN);
    });
  });
});
