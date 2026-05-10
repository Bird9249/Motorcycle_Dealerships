import { bunFileStorage } from "@/shared/files/bun-storage";
import { deleteObjectFromS3 } from "./s3-delete-object";

/**
 * ลบไฟล์รูปที่เก็บไว้ (รองรับทั้ง local /public/ และ MinIO key)
 * - ถ้า imageUrl ขึ้นต้นด้วย /public/ → ลบผ่าน bunFileStorage (local)
 * - มิฉะนั้นถือว่าเป็น key ใน MinIO → ลบผ่าน S3
 */
export async function deleteStoredImage(
  imageUrl: string | null,
): Promise<void> {
  if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
    return;
  }
  const trimmed = imageUrl.trim();
  if (trimmed.startsWith("/public/")) {
    await bunFileStorage.deleteByUrl(trimmed);
  } else {
    await deleteObjectFromS3(trimmed);
  }
}
