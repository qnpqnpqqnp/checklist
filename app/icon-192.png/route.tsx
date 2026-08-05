import { ImageResponse } from "next/og";
import { pwaIconElement } from "../pwa-icon";

export async function GET() {
  return new ImageResponse(pwaIconElement(192), { width: 192, height: 192 });
}
