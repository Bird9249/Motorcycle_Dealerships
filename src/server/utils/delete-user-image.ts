import { bunFileStorage } from "@/shared/files/bun-storage";
import { deleteObjectFromS3 } from "./s3-delete-object";

/**
 * ลบรูป avatar ของ user ใน object store ให้สอดคล้องกับข้อมูล
 * - ค่าเป็น key (เช่น uploads/avatars/xxx.jpg) → ลบจาก S3
 * - ค่าเป็น path/URL แบบเก่า (ขึ้นต้นด้วย / หรือ http) → ลบจาก local storage
 */
export async function deleteUserImage(
  value: string | null | undefined,
): Promise<void> {
  if (!value || typeof value !== "string" || value.trim() === "") return;
  const s = value.trim();
  const isLegacyUrl =
    s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/");
  if (isLegacyUrl) {
    await bunFileStorage.deleteByUrl(s);
  } else {
    await deleteObjectFromS3(s);
  }
}
