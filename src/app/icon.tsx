import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const contentType = "image/png";

export default async function Icon() {
  try {
    // Try to read the logo.png file
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const logoBuffer = fs.readFileSync(logoPath);
    return new Response(logoBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600, immutable",
      },
    });
  } catch (error) {
    // Fallback: return a simple SVG if PNG is not available
    return new ImageResponse(
      <div
        style={{
          fontSize: 88,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "bold",
        }}
      >
        FB
      </div>,
      {
        width: 192,
        height: 192,
      }
    );
  }
}
