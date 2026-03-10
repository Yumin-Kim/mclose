import { CommonEntity } from '../common/database/common.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity({
  name: 'mc_prompt_history',
})
export class PromptHistoryEntity extends CommonEntity {
  @Column('text', {
    name: 'question',
    comment: 'Prompt',
    nullable: true,
  })
  question: string;

  @Column('text', {
    name: 'answer',
    comment: 'Answer',
    nullable: true,
  })
  answer: string;

  @Column('text', {
    name: 'api_request_body',
    nullable: true,
    comment: 'API Request Body',
  })
  apiRequestBody: string;

  @Column('text', {
    name: 'api_response_body',
    nullable: true,
    comment: 'API Response Body',
  })
  apiResponseBody: string;

  @Column('varchar', {
    name: 'command_uuid',
    comment: 'Command UUID',
    length: 45,
    nullable: true,
  })
  commandUUID: string;

  // ------------------- relation -------------------
  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserEntity;
}
