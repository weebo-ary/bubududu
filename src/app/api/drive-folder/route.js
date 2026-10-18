import { requireCoupleAccess } from "@/utils/couple-access";
import {
  DriveFolderError,
  listDriveFolder,
  parseDriveLink,
} from "@/lib/google-drive.mjs";

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function GET(request) {
  try {
    const denied = await requireCoupleAccess();
    if (denied) return denied;
    const params = new URL(request.url).searchParams;
    const folder = parseDriveLink(params.get("url"));
    if (folder?.type !== "folder")
      return json(
        { error: "Paste a full public Google Drive folder link." },
        400,
      );
    const data = await listDriveFolder({
      folder,
      apiKey: process.env.GOOGLE_DRIVE_API_KEY,
      pageToken: params.get("pageToken") || "",
    });
    return json(data);
  } catch (error) {
    if (error instanceof DriveFolderError)
      return json({ error: error.message, code: error.code }, error.status);
    return json(
      { error: "Your album could not load right now. Please try again." },
      502,
    );
  }
}
