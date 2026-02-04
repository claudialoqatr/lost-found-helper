import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { qrCodeConfig, getBaseLoqatrIdURL, type ErrorCorrectionLevel } from "@/lib/qrCodeConfig";

describe("getBaseLoqatrIdURL", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Mock window.location.origin
    Object.defineProperty(window, "location", {
      value: { origin: "https://example.com" },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  it("returns URL with /qr-codes/ path", () => {
    expect(getBaseLoqatrIdURL()).toBe("https://example.com/qr-codes/");
  });

  it("uses current origin", () => {
    Object.defineProperty(window, "location", {
      value: { origin: "https://loqatr.com" },
      writable: true,
    });
    expect(getBaseLoqatrIdURL()).toBe("https://loqatr.com/qr-codes/");
  });
});

describe("qrCodeConfig", () => {
  describe("default configuration", () => {
    it("returns correct default dimensions", () => {
      const config = qrCodeConfig("https://example.com/ABC123");
      expect(config.width).toBe(600);
      expect(config.height).toBe(600);
    });

    it("returns correct default margin", () => {
      const config = qrCodeConfig("https://example.com/ABC123");
      expect(config.margin).toBe(10);
    });

    it("uses provided data URL", () => {
      const testUrl = "https://example.com/ABC123";
      const config = qrCodeConfig(testUrl);
      expect(config.data).toBe(testUrl);
    });

    it("defaults to square shape", () => {
      const config = qrCodeConfig("https://example.com");
      expect(config.shape).toBe("square");
    });

    it("defaults to M error correction level", () => {
      const config = qrCodeConfig("https://example.com");
      expect(config.qrOptions?.errorCorrectionLevel).toBe("M");
    });

    it("includes logo by default", () => {
      const config = qrCodeConfig("https://example.com");
      expect(config.image).toBe("/logo-icon.png");
    });
  });

  describe("gradient mode", () => {
    it("uses solid black color when gradient is false", () => {
      const config = qrCodeConfig("https://example.com", false);
      expect(config.dotsOptions?.color).toBe("#000000");
      expect(config.dotsOptions?.gradient).toBeUndefined();
    });

    it("uses gradient when gradient is true", () => {
      const config = qrCodeConfig("https://example.com", true);
      expect(config.dotsOptions?.color).toBeUndefined();
      expect(config.dotsOptions?.gradient).toBeDefined();
      expect(config.dotsOptions?.gradient?.type).toBe("radial");
    });

    it("gradient has correct color stops", () => {
      const config = qrCodeConfig("https://example.com", true);
      const gradient = config.dotsOptions?.gradient;
      expect(gradient?.colorStops).toHaveLength(2);
      expect(gradient?.colorStops?.[0]).toEqual({ offset: 0, color: "#8B5CF6" });
      expect(gradient?.colorStops?.[1]).toEqual({ offset: 1, color: "#0EA5E9" });
    });
  });

  describe("logo visibility", () => {
    it("includes logo when showLogo is true", () => {
      const config = qrCodeConfig("https://example.com", false, true);
      expect(config.image).toBe("/logo-icon.png");
    });

    it("excludes logo when showLogo is false", () => {
      const config = qrCodeConfig("https://example.com", false, false);
      expect(config.image).toBeUndefined();
    });

    it("configures image options correctly", () => {
      const config = qrCodeConfig("https://example.com", false, true);
      expect(config.imageOptions?.hideBackgroundDots).toBe(true);
      expect(config.imageOptions?.imageSize).toBe(0.4);
      expect(config.imageOptions?.margin).toBe(5);
    });
  });

  describe("square vs rounded styles", () => {
    it("uses square dots when square is true", () => {
      const config = qrCodeConfig("https://example.com", false, true, true);
      expect(config.dotsOptions?.type).toBe("square");
      expect(config.cornersSquareOptions?.type).toBe("square");
      expect(config.cornersDotOptions?.type).toBe("square");
    });

    it("uses rounded dots when square is false", () => {
      const config = qrCodeConfig("https://example.com", false, true, false);
      expect(config.dotsOptions?.type).toBe("rounded");
      expect(config.cornersSquareOptions?.type).toBe("extra-rounded");
      expect(config.cornersDotOptions?.type).toBe("dot");
    });

    it("uses white background for square style", () => {
      const config = qrCodeConfig("https://example.com", false, true, true);
      expect(config.backgroundOptions?.color).toBe("#FFFFFF");
    });

    it("uses transparent background for rounded style", () => {
      const config = qrCodeConfig("https://example.com", false, true, false);
      expect(config.backgroundOptions?.color).toBe("transparent");
    });

    it("uses circle shape for rounded style", () => {
      const config = qrCodeConfig("https://example.com", false, true, false);
      expect(config.shape).toBe("circle");
    });
  });

  describe("error correction levels", () => {
    const levels: ErrorCorrectionLevel[] = ["L", "M", "Q", "H"];

    it.each(levels)("accepts %s error correction level", (level) => {
      const config = qrCodeConfig("https://example.com", false, true, true, level);
      expect(config.qrOptions?.errorCorrectionLevel).toBe(level);
    });
  });

  describe("combined configurations", () => {
    it("creates gradient + rounded + no logo config", () => {
      const config = qrCodeConfig("https://example.com", true, false, false, "H");
      
      expect(config.dotsOptions?.gradient).toBeDefined();
      expect(config.image).toBeUndefined();
      expect(config.shape).toBe("circle");
      expect(config.qrOptions?.errorCorrectionLevel).toBe("H");
    });

    it("creates solid + square + logo config", () => {
      const config = qrCodeConfig("https://example.com", false, true, true, "L");
      
      expect(config.dotsOptions?.color).toBe("#000000");
      expect(config.image).toBe("/logo-icon.png");
      expect(config.shape).toBe("square");
      expect(config.qrOptions?.errorCorrectionLevel).toBe("L");
    });
  });
});
