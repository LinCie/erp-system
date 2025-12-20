interface FileUploadRequestProps {
  contentType: string;
  size: number;
}

interface FileUploadRequestResult {
  key: string;
  url: string;
}

interface IStorageService {
  requestImageUpload(
    props: FileUploadRequestProps,
  ): Promise<FileUploadRequestResult>;
  requestFileUpload(
    props: FileUploadRequestProps,
  ): Promise<FileUploadRequestResult>;
  delete(key: string): Promise<void>;
}

export type {
  FileUploadRequestProps,
  FileUploadRequestResult,
  IStorageService,
};
