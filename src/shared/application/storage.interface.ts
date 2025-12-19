interface ImageUploadRequestProps {
  contentType: string;
  size: number;
}

interface ImageUploadRequestResult {
  key: string;
  url: string;
}

interface IStorageService {
  requestImageUpload(
    props: ImageUploadRequestProps,
  ): Promise<ImageUploadRequestResult>;
  delete(key: string): Promise<void>;
}

export type {
  ImageUploadRequestProps,
  ImageUploadRequestResult,
  IStorageService,
};
