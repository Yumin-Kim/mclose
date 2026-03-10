import { PageRequest } from '../common/response/response-page';
export interface WorkspaceDto {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  originVideoUrl?: string;
  watermarkVideoUrl?: string;
  videoResolution?: string;
  videoDuration?: string;
  videoRatio?: string;
  videoFormat?: string;
  workspaceHashTag?: string;
  metaData?: string;
}

export interface updatekeywordDto {
  oldKeyword: string;
  newKeyword: string;
}

export interface UpdateWorkspaceKeywordDto {
  updateKeywordList: updatekeywordDto[] | []; // 사용자가 수정한 keyword list
  deleteKeywordList: string[] | []; // 사용자가 삭제한 keyword list
  finalKeywordList: string; // 최종적으로 사용자가 선택한 keyword list front에서 string[] -> string으로 변경
}

export interface MoveToWorkspaceDto {
  idList: number[];
  keyword: string;
}

export class WorkspaceQueryDto extends PageRequest {
  keyword?: string;
}
