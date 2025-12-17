import sharp from "sharp";

interface ProcessedImage {
  buffer: Uint8Array;
  size: number;
  format: string;
}

interface ProcessOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

const DEFAULT_OPTIONS: ProcessOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 80,
};

async function processImage(
  file: File,
  options: ProcessOptions = {},
): Promise<ProcessedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = new Uint8Array(arrayBuffer);

  const { data, info } = await sharp(inputBuffer)
    .resize({
      width: opts.maxWidth,
      height: opts.maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: opts.quality })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: new Uint8Array(data),
    size: info.size,
    format: "webp",
  };
}

export { processImage };
export type { ProcessedImage, ProcessOptions };
