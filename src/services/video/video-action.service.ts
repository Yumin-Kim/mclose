import { Injectable, Logger } from '@nestjs/common';
import { UserEntity } from 'src/entities/user.entity';
import { PromptHistoryEntity } from '../../entities/prompt-history.entity';
import { PromptHistoryRepository } from '../../repositories/prompt-history.repository';
import { RawVideoRepository } from '../../repositories/raw-video.repository';
import { FfmpegService } from '../../common/ffmpeg/ffmpeg.service';
import { RawVideoEntity } from '../../entities/raw-video.entity';
import { RawVideoDto } from '../../dto/video.dto';
import { In, Raw } from 'typeorm';
import { PagenationRes } from '../../common/response/response-page';
import { updatekeywordDto, MoveToWorkspaceDto } from '../../dto/workspace.dto';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { AwsS3StorageService } from '../../common/aws/s3/aws-s3-storage.service';
import { AWS_S3_BUCKET_PATH } from '../../constant';
import { Readable } from 'stream';

@Injectable()
export class VideoActionService {
  private readonly logger = new Logger(VideoActionService.name);
  private readonly awsS3VideoBucketName: string;

  constructor(
    private readonly rawVideoRespository: RawVideoRepository,
    private readonly ffmpegService: FfmpegService,
    private readonly configService: ConfigService,
    private readonly awsS3StorageService: AwsS3StorageService,
  ) {
    this.awsS3VideoBucketName = this.configService.get<string>(
      'AWS_S3_VIDEO_BUCKET_NAME',
    );
  }

  async list(keyword: string, user: UserEntity, page: number, limit: number) {
    let list = [];
    const where = {
      user: {
        id: user.id,
      },
      isDeleted: false,
    };

    if (keyword) {
      where['workspaceHashTag'] = Raw((alias) => `${alias} REGEXP :keyword`, {
        keyword: `(^|,)${keyword}(,|$)`,
      });
    }

    const [entityList, totalCount] =
      await this.rawVideoRespository.findAndCount({
        where,
        take: limit,
        skip: page,
        order: { id: 'DESC' },
      });

    if (entityList.length > 0) {
      list = entityList.map((entity) => {
        return {
          id: entity.id,
          title: entity.title,
          originVideoUrl: entity.originVideoUrl,
          watermarkVideoUrl: entity.watermarkVideoUrl,
          videoResolution: entity.videoResolution,
          videoDuration: entity.videoDuration,
          videoRatio: entity.videoRatio,
          videoFormat: entity.videoFormat,
          createdAt: entity.createdAt,
        };
      });
    }

    return new PagenationRes(page / limit, limit, totalCount, list);
  }

  async updateKeyword(user: UserEntity, updateKeywordList: updatekeywordDto[]) {
    for (const item of updateKeywordList) {
      const list = await this.rawVideoRespository.find({
        where: {
          user: {
            id: user.id,
          },
          workspaceHashTag: Raw((alias) => `${alias} REGEXP :keyword`, {
            keyword: `(^|,)${item.oldKeyword}(,|$)`,
          }),
        },
      });

      if (list.length === 0) return false;

      // 데이터를 업데이트하는 로직
      await Promise.all(
        list.map(async (ele) => {
          // 기존 태그에서 oldKeyword를 newKeyword로 교체
          const updatedTag = ele.workspaceHashTag
            .split(',')
            .map((tag) => (tag === item.oldKeyword ? item.newKeyword : tag))
            .join(',');

          // 데이터베이스에 업데이트
          await this.rawVideoRespository
            .createQueryBuilder('RawVideo')
            .update() // RawVideo 엔티티의 테이블 이름
            .set({ workspaceHashTag: updatedTag })
            .where('id = :id', { id: ele.id })
            .execute();
        }),
      );
    }

    return true;
  }

  async deleteKeyword(user: UserEntity, deleteKeywordList: string[]) {
    for (const hashTag of deleteKeywordList) {
      const list = await this.rawVideoRespository.find({
        where: {
          user: {
            id: user.id,
          },
          workspaceHashTag: Raw((alias) => `${alias} REGEXP :keyword`, {
            keyword: `(^|,)${hashTag}(,|$)`,
          }),
        },
      });

      if (list.length === 0) return false;

      // 데이터를 삭제하는 로직
      await Promise.all(
        list.map(async (item) => {
          // 기존 태그에서 deleteKeywordList를 삭제
          const updatedTag = item.workspaceHashTag
            .split(',')
            .filter((tag) => !deleteKeywordList.includes(tag))
            .join(',');

          // 데이터베이스에 업데이트
          await this.rawVideoRespository
            .createQueryBuilder('RawVideo')
            .update() // RawVideo 엔티티의 테이블 이름
            .set({ workspaceHashTag: updatedTag })
            .where('id = :id', { id: item.id })
            .execute();
        }),
      );
    }

    return true;
  }

  async updateTitle(user: UserEntity, rawVideoDto: RawVideoDto) {
    const entity = await this.rawVideoRespository.findOne({
      where: { user, id: rawVideoDto.id },
    });

    if (!entity) return false;

    await this.rawVideoRespository.update(entity.id, {
      title: rawVideoDto.title,
    });

    return true;
  }

  async delete(user: UserEntity, rawVideo: RawVideoEntity) {
    return this.rawVideoRespository.update(rawVideo.id, {
      isDeleted: true,
      deletedAt: () => 'CURRENT_TIMESTAMP',
    });
  }

  async moveToWorkspace(
    user: UserEntity,
    moveToWorkspaceDto: MoveToWorkspaceDto,
  ) {
    const list = await this.rawVideoRespository.find({
      where: {
        user: {
          id: user.id,
        },
        id: In(moveToWorkspaceDto.idList),
      },
    });

    if (list.length === 0) return false;

    await Promise.all(
      list.map(async (item) => {
        // 기존 태그에서 deleteKeywordList를 삭제
        let updatedTag = moveToWorkspaceDto.keyword;
        if (item.workspaceHashTag) {
          let prevTag = item.workspaceHashTag.split(',');

          // 중복 태그 제거
          prevTag = prevTag.filter((tag) => tag !== moveToWorkspaceDto.keyword);
          prevTag.push(moveToWorkspaceDto.keyword);
          updatedTag = prevTag.join(',');
        }

        // 데이터베이스에 업데이트
        await this.rawVideoRespository
          .createQueryBuilder('RawVideo')
          .update() // RawVideo 엔티티의 테이블 이름
          .set({ workspaceHashTag: updatedTag })
          .where('id = :id', { id: item.id })
          .execute();
      }),
    );

    return true;
  }

  // Sora 또는 Water Mark
  async prepare(
    commandUUID: string,
    user: UserEntity,
    promptHistoryEntity: PromptHistoryEntity,
  ) {
    const newEntity = new RawVideoEntity();
    newEntity.user = user;
    newEntity.promptHistory = promptHistoryEntity;
    newEntity.commandUUID = commandUUID;
    newEntity.title = '';

    return await this.rawVideoRespository.save(newEntity);
  }

  // Sora 또는 Water Mark 처리 이후 저장
  async transform(videoDto: RawVideoDto, user: UserEntity) {
    const rawVideoOutputKeyPath = `${AWS_S3_BUCKET_PATH.RAW_VIDEO}/`;
    const transformVideoOutputKeyPath = `${AWS_S3_BUCKET_PATH.TRANSFORMED_VIDEO}/`;
    let videoformat = '';

    // K_TODO: 현재 두번 요청을 보내고 있는데, 이 부분은 개선이 필요함
    // Request video stream
    const [originalVideoReponse01, originalVideoReponse02] = await Promise.all([
      axios.get(videoDto.originVideoUrl, {
        responseType: 'stream',
      }),
      axios.get(videoDto.originVideoUrl, {
        responseType: 'stream',
      }),
    ]);
    if (!originalVideoReponse01.data || !originalVideoReponse02.data) {
      throw new Error('Failed to fetch video stream.');
    }

    const streamForWatermark: Readable = originalVideoReponse01.data;
    const streamForRaw: Readable = originalVideoReponse02.data;

    // extract video metadata
    const videoMetaData = await this.ffmpegService.extractMetadata(
      videoDto.originVideoUrl,
    );
    if (!videoMetaData) {
      throw new Error('No video metadata');
    }
    if (videoMetaData instanceof Error) {
      throw new Error('Failed to extract video metadata');
    }
    if (!videoMetaData.streams || videoMetaData.streams.length === 0) {
      throw new Error('Invalid video metadata');
    }

    const { streams, format } = videoMetaData;

    // check video metadata
    const width = streams[0].coded_width;
    const height = streams[0].coded_height;
    const ratio =
      streams[0].display_aspect_ratio === 'N/A'
        ? this.calculateAspectRatio(width, height)
        : streams[0].display_aspect_ratio;
    const duration = streams[0].duration;
    const fileFormat = format.format_name;
    fileFormat.split(',').forEach((format) => {
      if (videoDto.originVideoUrl.lastIndexOf(format) !== -1) {
        videoformat = format;
      }
    });

    const unixTime = new Date().getTime();
    const fileName = `${unixTime}.mp4`;

    // 1. add watermark
    this.logger.debug(`Prepare to add watermark | ${fileName}`);
    const transformVideoStream =
      await this.ffmpegService.addWatermark(streamForWatermark);
    if (!transformVideoStream) {
      throw new Error('Failed to add watermark');
    }
    this.logger.debug(`Finish to add watermark | ${fileName}`);

    // 2. save origin video / transform video
    this.logger.log(`Prepare to save video | ${fileName}`);
    const [saveOriginS3KeyPath, saveTransformS3KeyPath] = await Promise.all([
      this.awsS3StorageService.streamParallelUpload(
        this.awsS3VideoBucketName,
        rawVideoOutputKeyPath,
        fileName,
        streamForRaw,
      ),
      this.awsS3StorageService.streamParallelUpload(
        this.awsS3VideoBucketName,
        transformVideoOutputKeyPath,
        fileName,
        transformVideoStream,
      ),
    ]);
    if (!saveOriginS3KeyPath || !saveTransformS3KeyPath) {
      throw new Error('Failed to save video to S3');
    }
    this.logger.log(`Finish to save video | ${fileName}`);

    const rawVideoOriginS3Url = this.awsS3StorageService.getPublicUrl(
      saveOriginS3KeyPath,
      this.awsS3VideoBucketName,
    );
    const transformS3Url = this.awsS3StorageService.getPublicUrl(
      saveTransformS3KeyPath,
      this.awsS3VideoBucketName,
    );
    // 3. update raw video data
    await this.rawVideoRespository.update(videoDto.id, {
      originVideoUrl: rawVideoOriginS3Url,
      watermarkVideoUrl: transformS3Url,
      videoResolution: `${width}x${height}`,
      videoDuration: duration.toString(),
      videoRatio: ratio,
      videoFormat: videoformat,
    });

    return true;
  }

  async getEntityById(id: number) {
    return this.rawVideoRespository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async getEntityByUserIdAndCommandUUID(userId: number, commandUUID: string) {
    return this.rawVideoRespository.findOne({
      where: { user: { id: userId }, commandUUID },
      relations: ['user'],
    });
  }

  calculateAspectRatio(width, height) {
    function gcd(a, b) {
      return b == 0 ? a : gcd(b, a % b);
    }

    const gcdValue = gcd(width, height);
    const aspectWidth = width / gcdValue;
    const aspectHeight = height / gcdValue;

    return `${aspectWidth}:${aspectHeight}`;
  }
}
