import { ImageResponse } from "next/og";
import { pwaIconElement } from "../pwa-icon";

export async function GET() {
  return new ImageResponse(pwaIconElement(512), { width: 512, height: 512 });
}
