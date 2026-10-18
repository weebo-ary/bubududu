import { requireCoupleAccess } from "@/utils/couple-access";
import { fetchDrivePhoto } from "@/lib/drive-photo.mjs";

export async function GET(request) {
  try {
    const denied = await requireCoupleAccess();
    if (denied) return denied;
    const query = new URL(request.url).searchParams;
    return await fetchDrivePhoto({
      id: query.get("id"),
      resourceKey: query.get("resourcekey") || "",
      size: Number(query.get("size")),
      apiKey: process.env.GOOGLE_DRIVE_API_KEY,
    });
  } catch {
    return Response.json(
      { error: "Your photo could not load. Please try again." },
      { status: 502, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
