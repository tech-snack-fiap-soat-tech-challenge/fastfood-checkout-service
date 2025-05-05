/* eslint-disable @typescript-eslint/no-misused-promises */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { OrderCreatedHandler } from './order-created.handler';
import { OrderCreatedEvent } from '@app/common/domain/events/order-created.event';
import { SqsService } from '@app/common/application/sqs-service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OrderCreatedListener implements OnModuleInit {
  private readonly queueUrl: string;
  private readonly logger = new Logger(OrderCreatedListener.name);
  private readonly MESSAGE_RECEIVE_INTERVAL = 5000; // 5 seconds

  constructor(
    private readonly handler: OrderCreatedHandler,
    private readonly sqsClient: SqsService,
    private readonly configService: ConfigService,
  ) {
    this.queueUrl = this.configService.get<string>('sqs.orderCreatedQueueUrl');
  }

  onModuleInit() {
    void this.listenForMessages();
  }

  private listenForMessages() {
    setInterval(async () => {
      try {
        const response = await this.sqsClient.receiveMessages(this.queueUrl);

        if (response && response.length > 0) {
          for (const message of response) {
            this.logger.log(`Received message: ${message.Body}`);

            // Process the message
            await this.handler.handle(
              JSON.parse(message.Body) as OrderCreatedEvent,
            );

            // Delete the message after processing
            await this.sqsClient.deleteMessage(
              this.queueUrl,
              message.ReceiptHandle,
            );

            this.logger.log(`Deleted message with ID: ${message.MessageId}`);
          }
        }
      } catch (error) {
        this.logger.error('Error receiving/deleting SQS message:', error);
      }
    }, this.MESSAGE_RECEIVE_INTERVAL); // Poll every 5 seconds
  }
}
