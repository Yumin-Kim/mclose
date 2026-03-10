import { Injectable, Logger } from '@nestjs/common';
import { UserEntity } from 'src/entities/user.entity';
import { PromptHistoryEntity } from '../../entities/prompt-history.entity';
import { PromptHistoryRepository } from '../../repositories/prompt-history.repository';
import { PromptDto } from '../../dto/prompt.dto';
import { DaemonRawVideoDto } from '../../dto/video.dto';

@Injectable()
export class PromptHistoryService {
  private readonly logger = new Logger(PromptHistoryService.name);

  constructor(
    private readonly promptHistoryRepository: PromptHistoryRepository,
  ) {}

  // 요청 History 생성
  async prepare(createPromptDto: DaemonRawVideoDto, user: UserEntity) {
    const newEnitiy = new PromptHistoryEntity();
    newEnitiy.question = createPromptDto.question;
    newEnitiy.apiRequestBody = JSON.stringify(createPromptDto);
    newEnitiy.commandUUID = createPromptDto.commandUUID;
    newEnitiy.user = user;

    return await this.promptHistoryRepository.save(newEnitiy);
  }

  // 요청 완료 이후 History 업데이트
  async complete(promptDto: PromptDto) {
    return await this.promptHistoryRepository.update(promptDto.id, {
      answer: promptDto.answer,
      apiResponseBody: promptDto.apiResponseBody,
    });
  }

  async getEntityByCommandUUID(commandUUID: string) {
    return await this.promptHistoryRepository.findOne({
      where: {
        commandUUID,
      },
    });
  }

  async getEntityByUserId(userId: number) {
    return await this.promptHistoryRepository.find({
      relations: ['user'],
      where: {
        user: {
          id: userId,
        },
      },
    });
  }

  async getEntityById(promptHistoryId: number) {
    return await this.promptHistoryRepository.findOne({
      relations: ['user'],
      where: {
        id: promptHistoryId,
      },
    });
  }
}
