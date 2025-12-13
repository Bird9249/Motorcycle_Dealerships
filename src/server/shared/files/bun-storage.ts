import { deletePublicFileByUrl, saveUploadedFile } from "./storage";

export const bunFileStorage = {
  async save(file: File, subdir: string) {
    return await saveUploadedFile(file, subdir);
  },
  async deleteByUrl(url: string) {
    return await deletePublicFileByUrl(url);
  },
};
