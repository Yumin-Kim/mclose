import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AdminScheduleService {
  // private readonly logger = new Logger(AdminScheduleService.name);
  // private fromEmail = null;
  // constructor(
  //   private readonly configService: ConfigService,
  //   private readonly interestedCustomerRepository: InterestedCustomerRepository,
  //   private readonly visitingCustomerRepository: VisitingCustomerRepository,
  //   private readonly managerRepository: ManagerRepository,
  //   private readonly awsSesService: AwsSesService,
  // ) {
  //   this.fromEmail =
  //     this.configService.get<string>('AWS_FROM_EMAIL') ||
  //     'no-reploy@example.net';
  // }
  // // 1 minute
  // // @Cron('* * * * * *')
  // @Cron('*/1 * * * *')
  // async batchInterestCustomerEmail() {
  //   const entityList = await this.interestedCustomerRepository.find({
  //     where: {
  //       isNotified: false,
  //     },
  //   });
  //   const manager = await this.managerRepository.find({
  //     where: [
  //       {
  //         type: 'INTERESTED',
  //       },
  //       {
  //         type: 'VISITED_INTERESTED',
  //       },
  //     ],
  //   });
  //   if (entityList.length === 0) {
  //     this.logger.log('No interested customer');
  //     return;
  //   }
  //   if (manager.length === 0) {
  //     this.logger.log('No manager');
  //     return;
  //   }
  //   this.logger.log('[START] Send email to interested customer');
  //   this.logger.log(
  //     `Check Interested Customer's Entity List : ${entityList.length}`,
  //   );
  //   let managerEmailList = manager.map((m) => m.email);
  //   const interestEmailTemplate = await readFile(
  //     join(__dirname, '../templates/interested_customer_email.html'),
  //     'utf8',
  //   );
  //   // [] => [[], [], []]
  //   managerEmailList = managerEmailList.reduce((acc, cur, idx) => {
  //     // arr size 2
  //     if (idx % 10 === 0) {
  //       acc.push([]);
  //     }
  //     acc[acc.length - 1].push(cur);
  //     return acc;
  //   }, []);
  //   for (const item of managerEmailList) {
  //     for (const entity of entityList) {
  //       await this.awsSesService.sendEmail(
  //         this.fromEmail,
  //         item,
  //         '관심 고객이 관심을 표시했습니다.',
  //         interestEmailTemplate,
  //       );
  //     }
  //   }
  //   this.logger.log('[END] Send email to interested customer done');
  //   for (const entity of entityList) {
  //     entity.isNotified = true;
  //     await this.interestedCustomerRepository.save(entity);
  //   }
  //   this.logger.log(`Total interested customer : ${entityList.length}`);
  // }
  // @Cron('*/1 * * * *')
  // async batchVisitCustomerEmail() {
  //   const entityList = await this.visitingCustomerRepository.find({
  //     where: {
  //       isNotified: false,
  //     },
  //   });
  //   const manager = await this.managerRepository.find({
  //     where: [
  //       {
  //         type: 'VISITED',
  //       },
  //       {
  //         type: 'VISITED_INTERESTED',
  //       },
  //     ],
  //   });
  //   if (entityList.length === 0) {
  //     this.logger.log('No visited customer');
  //     return;
  //   }
  //   if (manager.length === 0) {
  //     this.logger.log('No manager');
  //     return;
  //   }
  //   this.logger.log('[START] Batch visit customer email');
  //   this.logger.log(
  //     `Check Visited Customer's Entity List : ${entityList.length}`,
  //   );
  //   let managerEmailList = manager.map((m) => m.email);
  //   managerEmailList = managerEmailList.reduce((acc, cur, idx) => {
  //     // arr size 2
  //     if (idx % 10 === 0) {
  //       acc.push([]);
  //     }
  //     acc[acc.length - 1].push(cur);
  //     return acc;
  //   }, []);
  //   const visitEmailTemplate = await readFile(
  //     join(__dirname, '../templates/visited_customer_email.html'),
  //     'utf8',
  //   );
  //   for (const item of managerEmailList) {
  //     for (const entity of entityList) {
  //       await this.awsSesService.sendEmail(
  //         this.fromEmail,
  //         item,
  //         '방문 고객이 방문을 표시했습니다.',
  //         visitEmailTemplate,
  //       );
  //     }
  //   }
  //   this.logger.log('Send email to visited customer done');
  //   for (const entity of entityList) {
  //     entity.isNotified = true;
  //     await this.visitingCustomerRepository.save(entity);
  //   }
  //   this.logger.log('Batch visit customer email done');
  //   this.logger.log(`Total visited customer : ${entityList.length}`);
  //   this.logger.log('[END] Batch visit customer email');
  // }
}
