import type { Options } from "qr-code-styling";

/**
 * Error correction level for QR codes
 * L: 7% recovery | M: 15% recovery | Q: 25% recovery | H: 30% recovery
 */
export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

/**
 * Base URL for QR code scanning
 */
export const getBaseLoqatrIdURL = () => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/qr-codes/`;
};

/**
 * Configuration for styled QR codes
 * @param data - The URL or data to encode
 * @param gradient - Whether to use gradient colors
 * @param showLogo - Whether to show the logo in center
 * @param square - Whether to use square dots (false = extra-rounded/liquid)
 * @param errorCorrectionLevel - Error correction level (L/M/Q/H)
 */
export const qrCodeConfig = (
  data: string,
  gradient: boolean = false,
  showLogo: boolean = true,
  square: boolean = true,
  errorCorrectionLevel: ErrorCorrectionLevel = "M"
): Options => ({
  width: 600,
  height: 600,
  data,
  margin: 10,
  shape: square ? "square" : "circle",
  qrOptions: {
    errorCorrectionLevel,
  },
  dotsOptions: {
    color: gradient ? undefined : "#000000",
    type: square ? "square" : "rounded",
    gradient: gradient
      ? {
          type: "radial",
          colorStops: [
            { offset: 0, color: "#8B5CF6" },
            { offset: 1, color: "#0EA5E9" },
          ],
        }
      : undefined,
  },
  backgroundOptions: {
    color: square ? "#FFFFFF" : "transparent",
  },
  imageOptions: {
    hideBackgroundDots: true,
    imageSize: 0.4,
    margin: 5,
  },
  image: showLogo ? "/logo-icon.png" : undefined,
  cornersSquareOptions: {
    type: square ? "square" : "extra-rounded",
  },
  cornersDotOptions: {
    type: square ? "square" : "dot",
  },
});
