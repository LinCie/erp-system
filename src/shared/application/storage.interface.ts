interface UploadResult {
  key: string;
  size: number;
}

interface IStorageService {
  upload(file: File, folder: string): Promise<UploadResult>;
  delete(key: string): Promise<void>;
}

export type { IStorageService, UploadResult };
