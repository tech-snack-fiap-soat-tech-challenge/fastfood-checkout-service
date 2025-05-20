import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SqsService {
  private readonly sqsClient: SQSClient;

  constructor(private readonly configService: ConfigService) {
    this.sqsClient = new SQSClient({
      region: this.configService.get('sqs.region'),
      endpoint: this.configService.get('sqs.endpoint'),
    });
  }

  async sendMessage(queueUrl: string, groupId: string, messageBody: string) {
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageGroupId: groupId,
      MessageBody: messageBody,
    });
    return this.sqsClient.send(command);
  }

  async receiveMessages(queueUrl: string) {
    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 5,
    });

    const response = await this.sqsClient.send(command);
    return response.Messages || [];
  }

  async deleteMessage(queueUrl: string, receiptHandle: string) {
    const command = new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    });

    return this.sqsClient.send(command);
  }
}
