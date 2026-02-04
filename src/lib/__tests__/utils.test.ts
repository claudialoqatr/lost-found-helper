import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  describe("basic functionality", () => {
    it("returns empty string for no arguments", () => {
      expect(cn()).toBe("");
    });

    it("returns single class unchanged", () => {
      expect(cn("foo")).toBe("foo");
    });

    it("merges multiple class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("handles undefined values", () => {
      expect(cn("foo", undefined, "bar")).toBe("foo bar");
    });

    it("handles null values", () => {
      expect(cn("foo", null, "bar")).toBe("foo bar");
    });

    it("handles false values", () => {
      expect(cn("foo", false, "bar")).toBe("foo bar");
    });
  });

  describe("conditional classes", () => {
    it("includes class when condition is true", () => {
      expect(cn("base", true && "active")).toBe("base active");
    });

    it("excludes class when condition is false", () => {
      expect(cn("base", false && "active")).toBe("base");
    });

    it("handles object syntax for conditionals", () => {
      expect(cn({ active: true, disabled: false })).toBe("active");
    });

    it("handles mixed array and string inputs", () => {
      expect(cn("foo", ["bar", "baz"])).toBe("foo bar baz");
    });
  });

  describe("Tailwind class deduplication", () => {
    it("deduplicates conflicting padding classes", () => {
      expect(cn("p-4", "p-2")).toBe("p-2");
    });

    it("deduplicates conflicting margin classes", () => {
      expect(cn("m-4", "m-8")).toBe("m-8");
    });

    it("deduplicates conflicting text color classes", () => {
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("deduplicates conflicting background classes", () => {
      expect(cn("bg-white", "bg-black")).toBe("bg-black");
    });

    it("keeps non-conflicting classes", () => {
      expect(cn("p-4", "m-4")).toBe("p-4 m-4");
    });

    it("deduplicates flex direction classes", () => {
      expect(cn("flex-row", "flex-col")).toBe("flex-col");
    });

    it("handles hover variants correctly", () => {
      expect(cn("hover:bg-red-500", "hover:bg-blue-500")).toBe("hover:bg-blue-500");
    });
  });

  describe("complex scenarios", () => {
    it("handles typical component class pattern", () => {
      const baseClasses = "px-4 py-2 rounded-md";
      const variantClasses = "bg-primary text-primary-foreground";
      const sizeClasses = "text-sm";
      
      expect(cn(baseClasses, variantClasses, sizeClasses)).toBe(
        "px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm"
      );
    });

    it("handles override pattern correctly", () => {
      const defaultClasses = "p-4 bg-white text-black";
      const overrideClasses = "p-2 bg-black";
      
      expect(cn(defaultClasses, overrideClasses)).toBe("text-black p-2 bg-black");
    });
  });
});
