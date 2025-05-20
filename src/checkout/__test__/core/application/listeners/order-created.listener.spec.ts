import { OrderCreatedHandler } from '@app/checkout/core/application/listeners/order/order-created.handler';
import { OrderCreatedListener } from '@app/checkout/core/application/listeners/order/order-created.listener';
import { SqsService } from '@app/common/application/sqs-service';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

jest.useFakeTimers({ timerLimit: 10 });

describe('OrderCreatedListener', () => {
  let listener: OrderCreatedListener;
  let handler: jest.Mocked<OrderCreatedHandler>;
  let sqsClient: jest.Mocked<SqsService>;
  let loggerErrorSpy: jest.SpyInstance;

  const mockQueueUrl =
    'https://sqs.us-east-1.amazonaws.com/123456789012/order-created';

  // Helper function to flush promises
  const flushPromises = () =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    new Promise(jest.requireActual('timers').setImmediate);

  beforeEach(async () => {
    // Mock the logger error method
    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderCreatedListener,
        {
          provide: OrderCreatedHandler,
          useValue: {
            handle: jest.fn(),
          },
        },
        {
          provide: SqsService,
          useValue: {
            receiveMessages: jest.fn(),
            deleteMessage: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(mockQueueUrl),
          },
        },
      ],
    }).compile();

    listener = module.get<OrderCreatedListener>(OrderCreatedListener);
    handler = module.get(OrderCreatedHandler);
    sqsClient = module.get(SqsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    describe('Given the service is initializing', () => {
      describe('When onModuleInit is called', () => {
        it('Should start listening for messages', () => {
          // Arrange
          const listenForMessagesSpy = jest.spyOn(
            listener,
            'listenForMessages',
          );

          // Act
          listener.onModuleInit();

          // Assert
          expect(listenForMessagesSpy).toHaveBeenCalled();
          //   expect(setIntervalSpy).toHaveBeenCalled();
        });
      });
    });
  });

  describe('listenForMessages', () => {
    describe('Given there are messages in the queue', () => {
      describe('When listenForMessages is called', () => {
        it('Should process and delete each message', async () => {
          // Arrange
          const mockMessages = [
            {
              MessageId: 'msg1',
              Body: JSON.stringify({
                orderId: 123,
                customerName: 'John Doe',
                total: 50.0,
              }),
              ReceiptHandle: 'receipt1',
            },
            {
              MessageId: 'msg2',
              Body: JSON.stringify({
                orderId: 456,
                customerName: 'Jane Smith',
                total: 75.0,
              }),
              ReceiptHandle: 'receipt2',
            },
          ];

          sqsClient.receiveMessages.mockResolvedValueOnce(mockMessages);
          handler.handle.mockResolvedValueOnce();

          // Act
          listener.listenForMessages();
          jest.advanceTimersByTime(10000); // Fast-forward the timer
          await flushPromises();

          // Assert
          expect(sqsClient.receiveMessages).toHaveBeenCalledWith(mockQueueUrl);
          expect(handler.handle).toHaveBeenCalledTimes(2);

          // Check first message
          expect(handler.handle).toHaveBeenCalledWith(
            expect.objectContaining({
              orderId: 123,
              customerName: 'John Doe',
              total: 50.0,
            }),
          );
          expect(sqsClient.deleteMessage).toHaveBeenCalledWith(
            mockQueueUrl,
            'receipt1',
          );

          // Check second message
          expect(handler.handle).toHaveBeenCalledWith(
            expect.objectContaining({
              orderId: 456,
              customerName: 'Jane Smith',
              total: 75.0,
            }),
          );
          expect(sqsClient.deleteMessage).toHaveBeenCalledWith(
            mockQueueUrl,
            'receipt2',
          );
        });
      });
    });

    describe('Given there are no messages in the queue', () => {
      describe('When listenForMessages is called', () => {
        it('Should not process any messages', async () => {
          // Arrange
          sqsClient.receiveMessages.mockResolvedValueOnce([]);

          // Act
          listener.listenForMessages();
          jest.advanceTimersByTime(10000); // Fast-forward the timer
          await flushPromises();

          // Assert
          expect(sqsClient.receiveMessages).toHaveBeenCalledWith(mockQueueUrl);
          expect(handler.handle).not.toHaveBeenCalled();
          expect(sqsClient.deleteMessage).not.toHaveBeenCalled();
        });
      });
    });

    describe('Given an error occurs during message processing', () => {
      describe('When listenForMessages is called', () => {
        it('Should log the error', async () => {
          // Arrange
          const mockError = new Error('Processing error');
          sqsClient.receiveMessages.mockRejectedValueOnce(mockError);

          // Act
          listener.listenForMessages();
          jest.advanceTimersByTime(10000); // Fast-forward the timer
          await flushPromises();

          // Assert
          expect(sqsClient.receiveMessages).toHaveBeenCalledWith(mockQueueUrl);
          expect(loggerErrorSpy).toHaveBeenCalledWith(
            'Error receiving/deleting SQS message:',
            mockError,
          );
          expect(handler.handle).not.toHaveBeenCalled();
          expect(sqsClient.deleteMessage).not.toHaveBeenCalled();
        });
      });
    });

    describe('Given an error occurs with a specific message', () => {
      describe('When listenForMessages is called', () => {
        it('Should continue processing other messages', async () => {
          // Arrange
          const mockMessages = [
            {
              MessageId: 'msg1',
              Body: JSON.stringify({
                orderId: 123,
                customerName: 'John Doe',
                total: 50.0,
              }),
              ReceiptHandle: 'receipt1',
            },
            {
              MessageId: 'msg2',
              Body: 'invalid-json', // Will cause JSON.parse to fail
              ReceiptHandle: 'receipt2',
            },
          ];

          sqsClient.receiveMessages.mockResolvedValueOnce(mockMessages);

          // Act
          listener.listenForMessages();
          jest.advanceTimersByTime(10000); // Fast-forward the timer
          await flushPromises();

          // Assert
          expect(sqsClient.receiveMessages).toHaveBeenCalledWith(mockQueueUrl);
          expect(loggerErrorSpy).toHaveBeenCalledWith(
            'Error receiving/deleting SQS message:',
            expect.any(Error),
          );
          expect(handler.handle).toHaveBeenCalledTimes(1); // Only first message processed
          expect(sqsClient.deleteMessage).toHaveBeenCalledTimes(1);
          expect(sqsClient.deleteMessage).toHaveBeenCalledWith(
            mockQueueUrl,
            'receipt1',
          );
        });
      });
    });
  });
});
