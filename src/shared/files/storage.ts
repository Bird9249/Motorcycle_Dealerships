import { mkdir } from "node:fs/promises";
import { extname, join } from "node:path";

const PUBLIC_DIR = join(process.cwd(), "public");

export async function ensurePublicDir(subdir?: string) {
  const dir = subdir ? join(PUBLIC_DIR, subdir) : PUBLIC_DIR;
  const exists = await Bun.file(dir).exists();
  if (!exists) {
    await mkdir(dir, { recursive: true });
  }
  return dir;
}

export async function saveUploadedFile(
  file: File,
  subdir = "",
): Promise<{ path: string; url: string; filename: string }> {
  const dir = await ensurePublicDir(subdir);
  const ext = extname(file.name || "");
  const filename = `${Bun.randomUUIDv7()}${ext || ""}`;
  const filepath = join(dir, filename);
  await Bun.write(filepath, file);
  const url = `/public${subdir ? `/${subdir}` : ""}/${filename}`;
  return { path: filepath, url, filename };
}

export async function deletePublicFileByUrl(url: string): Promise<boolean> {
  if (!url.startsWith("/public/")) return false;
  const rel = url.replace("/public/", "");
  const filepath = join(PUBLIC_DIR, rel);
  try {
    await Bun.file(filepath).delete();
    return true;
  } catch {
    return false;
  }
}
