import type { Options } from "qr-code-styling";

/**
 * Base URL for QR code scanning
 */
export const getBaseLoqatrIdURL = () => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/qr-codes/`;
};

/**
 * Configuration for styled QR codes
 */
export const qrCodeConfig = (
  data: string,
  gradient: boolean = false,
  showLogo: boolean = true,
  square: boolean = true
): Options => ({
  width: 300,
  height: 300,
  data,
  margin: 10,
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
    color: "#FFFFFF",
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
