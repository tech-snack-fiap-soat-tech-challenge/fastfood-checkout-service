/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { SqsService } from '@app/common/application/sqs-service';
import { SQSClient } from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@aws-sdk/client-sqs', () => {
  return {
    SQSClient: jest.fn(),
    SendMessageCommand: jest.fn().mockImplementation((input) => ({ input })),
    ReceiveMessageCommand: jest.fn().mockImplementation((input) => ({ input })),
    DeleteMessageCommand: jest.fn().mockImplementation((input) => ({ input })),
  };
});

describe('SqsService', () => {
  let service: SqsService;
  let configService: jest.Mocked<ConfigService>;
  let sqsClient: jest.Mocked<SQSClient>;

  beforeEach(async () => {
    // Create a mock SQS client
    sqsClient = {
      send: jest.fn(),
    } as unknown as jest.Mocked<SQSClient>;

    // Mock the SQSClient constructor
    (SQSClient as jest.Mock).mockImplementation(() => sqsClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SqsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'sqs.region': 'us-east-1',
                'sqs.endpoint': 'http://localhost:4566',
              };
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SqsService>(SqsService);
    configService = module.get(ConfigService);
    sqsClient = service['sqsClient'] as jest.Mocked<SQSClient>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    describe('Given valid queue URL and message body', () => {
      describe('When sendMessage is called', () => {
        it('Should send a message to the specified SQS queue', async () => {
          // Arrange
          const queueUrl =
            'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue';
          const messageBody = '{"orderId": 123, "status": "completed"}';

          // Act
          await service.sendMessage(queueUrl, messageBody);

          // Assert
          expect(sqsClient.send).toHaveBeenCalledTimes(1);
          expect(sqsClient.send).toHaveBeenCalledWith(
            expect.objectContaining({
              input: {
                QueueUrl: queueUrl,
                MessageBody: messageBody,
              },
            }),
          );
        });
      });
    });

    describe('Given SQS client throws an error', () => {
      describe('When sendMessage is called', () => {
        it('Should propagate the error', async () => {
          // Arrange
          const queueUrl =
            'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue';
          const messageBody = '{"orderId": 123, "status": "completed"}';
          const error = new Error('SQS error');
          (sqsClient.send as jest.Mock).mockRejectedValueOnce(error);

          // Act & Assert
          await expect(
            service.sendMessage(queueUrl, messageBody),
          ).rejects.toThrow('SQS error');
          expect(sqsClient.send).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  describe('receiveMessages', () => {
    describe('Given a valid queue URL', () => {
      describe('When receiveMessages is called and messages exist', () => {
        it('Should return the received messages', async () => {
          // Arrange
          const queueUrl =
            'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue';
          const expectedMessages = [
            {
              MessageId: 'msg1',
              Body: 'message body 1',
              ReceiptHandle: 'receipt1',
            },
            {
              MessageId: 'msg2',
              Body: 'message body 2',
              ReceiptHandle: 'receipt2',
            },
          ];

          (sqsClient.send as jest.Mock).mockResolvedValueOnce({
            Messages: expectedMessages,
          });

          // Act
          const result = await service.receiveMessages(queueUrl);

          // Assert
          expect(sqsClient.send).toHaveBeenCalledTimes(1);
          expect(sqsClient.send).toHaveBeenCalledWith(
            expect.objectContaining({
              input: {
                QueueUrl: queueUrl,
                MaxNumberOfMessages: 10,
                WaitTimeSeconds: 5,
              },
            }),
          );
          expect(result).toEqual(expectedMessages);
        });
      });

      describe('When receiveMessages is called and no messages exist', () => {
        it('Should return an empty array', async () => {
          // Arrange
          const queueUrl =
            'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue';

          (sqsClient.send as jest.Mock).mockResolvedValueOnce({});

          // Act
          const result = await service.receiveMessages(queueUrl);

          // Assert
          expect(sqsClient.send).toHaveBeenCalledTimes(1);
          expect(result).toEqual([]);
        });
      });
    });

    describe('Given SQS client throws an error', () => {
      describe('When receiveMessages is called', () => {
        it('Should propagate the error', async () => {
          // Arrange
          const queueUrl =
            'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue';
          const error = new Error('SQS receive error');

          (sqsClient.send as jest.Mock).mockRejectedValueOnce(error);

          // Act & Assert
          await expect(service.receiveMessages(queueUrl)).rejects.toThrow(
            'SQS receive error',
          );
          expect(sqsClient.send).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  describe('deleteMessage', () => {
    describe('Given valid queue URL and receipt handle', () => {
      describe('When deleteMessage is called', () => {
        it('Should delete the specified message from the queue', async () => {
          // Arrange
          const queueUrl =
            'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue';
          const receiptHandle = 'receipt-handle-123';

          const expectedResponse = {};
          (sqsClient.send as jest.Mock).mockResolvedValueOnce(expectedResponse);

          // Act
          const result = await service.deleteMessage(queueUrl, receiptHandle);

          // Assert
          expect(sqsClient.send).toHaveBeenCalledTimes(1);
          expect(sqsClient.send).toHaveBeenCalledWith(
            expect.objectContaining({
              input: {
                QueueUrl: queueUrl,
                ReceiptHandle: receiptHandle,
              },
            }),
          );
          expect(result).toEqual(expectedResponse);
        });
      });
    });

    describe('Given SQS client throws an error', () => {
      describe('When deleteMessage is called', () => {
        it('Should propagate the error', async () => {
          // Arrange
          const queueUrl =
            'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue';
          const receiptHandle = 'receipt-handle-123';
          const error = new Error('SQS delete error');

          (sqsClient.send as jest.Mock).mockRejectedValueOnce(error);

          // Act & Assert
          await expect(
            service.deleteMessage(queueUrl, receiptHandle),
          ).rejects.toThrow('SQS delete error');
          expect(sqsClient.send).toHaveBeenCalledTimes(1);
        });
      });
    });
  });
});
