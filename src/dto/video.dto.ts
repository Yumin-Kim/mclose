export interface RawVideoDto {
  id?: number;
  originVideoUrl?: string;
  watermarkVideoUrl?: string;
  videoResolution?: string;
  videoDuration?: string;
  videoRatio?: string;
  videoFormat?: string;
  workspaceHashTag?: string;
  metaData?: string;
  title?: string;
}

export interface DaemonRawVideoDto {
  commandUUID: string;
  id?: number;
  userId?: number;
  question?: string;
  answer?: string;
  apiRequestBody?: string;
  apiResponseBody?: string;
  videoUrl?: string;
  width?: number;
  height?: number;
}
