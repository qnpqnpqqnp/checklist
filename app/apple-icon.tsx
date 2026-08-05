import { ImageResponse } from "next/og";
import { pwaIconElement } from "./pwa-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(pwaIconElement(180), size);
}
