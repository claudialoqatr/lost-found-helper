import { describe, it, expect } from "vitest";
import { isPasswordStrong } from "@/components/PasswordStrengthIndicator";

describe("isPasswordStrong", () => {
  describe("rejects weak passwords", () => {
    it("rejects empty password", () => {
      expect(isPasswordStrong("")).toBe(false);
    });

    it("rejects password under 8 characters", () => {
      expect(isPasswordStrong("Aa1!")).toBe(false);
      expect(isPasswordStrong("Aa1!abc")).toBe(false);
    });

    it("rejects password without uppercase", () => {
      expect(isPasswordStrong("abcdefgh1!")).toBe(false);
    });

    it("rejects password without lowercase", () => {
      expect(isPasswordStrong("ABCDEFGH1!")).toBe(false);
    });

    it("rejects password without number", () => {
      expect(isPasswordStrong("Abcdefgh!")).toBe(false);
    });

    it("rejects password without special character", () => {
      expect(isPasswordStrong("Abcdefgh1")).toBe(false);
    });
  });

  describe("accepts strong passwords", () => {
    it("accepts password meeting all requirements", () => {
      expect(isPasswordStrong("Abcdefg1!")).toBe(true);
    });

    it("accepts password with various special characters", () => {
      expect(isPasswordStrong("Abcdefg1@")).toBe(true);
      expect(isPasswordStrong("Abcdefg1#")).toBe(true);
      expect(isPasswordStrong("Abcdefg1$")).toBe(true);
      expect(isPasswordStrong("Abcdefg1%")).toBe(true);
      expect(isPasswordStrong("Abcdefg1^")).toBe(true);
      expect(isPasswordStrong("Abcdefg1&")).toBe(true);
      expect(isPasswordStrong("Abcdefg1*")).toBe(true);
    });

    it("accepts longer passwords meeting requirements", () => {
      expect(isPasswordStrong("MyVerySecurePassword123!")).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles exactly 8 character password meeting all requirements", () => {
      expect(isPasswordStrong("Abcdef1!")).toBe(true);
    });

    it("handles password with multiple special characters", () => {
      expect(isPasswordStrong("Abc!@#$%1")).toBe(true);
    });

    it("handles password with spaces", () => {
      // Space is not in the special character list, so this should fail
      expect(isPasswordStrong("Abc def 1")).toBe(false);
    });
  });
});
