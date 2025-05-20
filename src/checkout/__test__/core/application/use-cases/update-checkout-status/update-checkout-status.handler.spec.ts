import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { UpdateCheckoutStatusHandler } from '@app/checkout/core/application/use-cases/update-checkout-status/update-checkout-status.handler';
import { ICheckoutRepository } from '@app/checkout/core/domain/interfaces/repositories/checkout.repository.interface';
import { IPaymentGateway } from '@app/checkout/core/domain/interfaces/gateways/payment-gateway.interface';
import { SqsService } from '@app/common/application/sqs-service';
import { UpdateCheckoutStatusCommand } from '@app/checkout/core/application/use-cases/update-checkout-status/update-checkout-status.command';
import { CheckoutEntity } from '@app/checkout/core/domain/entities/checkout.entity';
import { Status } from '@app/checkout/core/application/enums/status.enum';
import { UpdateFailedException } from '@app/common/exceptions/entity-update-failed.exception';
import { SendMessageCommandOutput } from '@aws-sdk/client-sqs';
import { CheckoutOutput } from '@app/checkout/core/application/dtos/checkout.output';
import { UpdateCheckoutStatusOutput } from '@app/checkout/core/application/use-cases/update-checkout-status/update-checkout-status.output';

describe('UpdateCheckoutStatusHandler', () => {
  let handler: UpdateCheckoutStatusHandler;
  let checkoutRepository: jest.Mocked<ICheckoutRepository>;
  let paymentGateway: jest.Mocked<IPaymentGateway>;
  let sqsService: jest.Mocked<SqsService>;

  const mockQueueUrl =
    'https://sqs.us-east-1.amazonaws.com/123456789012/payment-completed.fifo';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCheckoutStatusHandler,
        {
          provide: ICheckoutRepository,
          useValue: {
            getByOrderId: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: IPaymentGateway,
          useValue: {
            getByArgs: jest.fn(),
          },
        },
        {
          provide: SqsService,
          useValue: {
            sendMessage: jest.fn(),
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

    handler = module.get<UpdateCheckoutStatusHandler>(
      UpdateCheckoutStatusHandler,
    );
    checkoutRepository = module.get(ICheckoutRepository);
    paymentGateway = module.get(IPaymentGateway);
    sqsService = module.get(SqsService);
  });

  // Helper functions
  const setupSuccessfulScenario = (
    paymentId: string,
    orderId: string,
    paymentStatus: string,
    checkoutId: number,
    paymentCode: string,
    newStatus: Status,
  ) => {
    const command = new UpdateCheckoutStatusCommand(paymentId);

    const mockPayment = {
      id: paymentId,
      orderId,
      status: paymentStatus,
    };

    const mockCheckout: Partial<CheckoutEntity> = {
      id: checkoutId,
      paymentId,
      paymentCode,
      status: Status.WaitingPayment,
      orderId,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      changeData: jest.fn(),
    };

    const updatedCheckout = {
      ...mockCheckout,
      status: newStatus,
      updatedAt: new Date('2023-01-02'),
    };

    // Setup mocks
    paymentGateway.getByArgs.mockResolvedValueOnce(mockPayment);
    checkoutRepository.getByOrderId.mockResolvedValueOnce(
      mockCheckout as CheckoutEntity,
    );
    checkoutRepository.update.mockResolvedValueOnce(
      updatedCheckout as CheckoutEntity,
    );
    sqsService.sendMessage.mockResolvedValueOnce(
      {} as SendMessageCommandOutput,
    );

    return {
      command,
      mockPayment,
      mockCheckout,
      updatedCheckout,
    };
  };

  const assertSuccessfulScenario = (
    result: UpdateCheckoutStatusOutput,
    paymentId: string,
    orderId: string,
    checkoutId: number,
    checkout: CheckoutEntity,
    updatedCheckout: CheckoutEntity,
    newStatus: Status,
  ) => {
    expect(paymentGateway.getByArgs).toHaveBeenCalledWith(paymentId);
    expect(checkoutRepository.getByOrderId).toHaveBeenCalledWith(orderId);
    expect(checkout.changeData).toHaveBeenCalledWith({
      ...checkout,
      status: newStatus,
    });
    expect(checkoutRepository.update).toHaveBeenCalledWith(
      checkoutId,
      checkout,
    );
    expect(sqsService.sendMessage).toHaveBeenCalledWith(
      mockQueueUrl,
      `checkout-${orderId}`,
      expect.stringContaining(orderId),
    );
    expect(result.checkout).toEqual(new CheckoutOutput(updatedCheckout));
  };

  describe('Given a valid payment ID with approved status', () => {
    describe('When execute is called', () => {
      it('Should update checkout status to paid, publish an event to SQS, and return the updated checkout', async () => {
        // Arrange
        const paymentId = 'pay_123';
        const orderId = 'order_123';
        const { command, mockCheckout, updatedCheckout } =
          setupSuccessfulScenario(
            paymentId,
            orderId,
            'approved',
            1,
            'PC123',
            Status.Paid,
          );

        // Act
        const result = await handler.execute(command);

        // Assert
        assertSuccessfulScenario(
          result,
          paymentId,
          orderId,
          updatedCheckout.id,
          mockCheckout as CheckoutEntity,
          updatedCheckout as CheckoutEntity,
          Status.Paid,
        );
      });
    });
  });

  describe('Given a valid payment ID with rejected status', () => {
    describe('When execute is called', () => {
      it('Should update checkout status to refused, publish an event to SQS, and return the updated checkout', async () => {
        // Arrange
        const paymentId = 'pay_456';
        const orderId = 'order_102';
        const { command, mockCheckout, updatedCheckout } =
          setupSuccessfulScenario(
            paymentId,
            orderId,
            'rejected',
            2,
            'PC456',
            Status.Refused,
          );

        // Act
        const result = await handler.execute(command);

        // Assert
        assertSuccessfulScenario(
          result,
          paymentId,
          orderId,
          updatedCheckout.id,
          mockCheckout as CheckoutEntity,
          updatedCheckout as CheckoutEntity,
          Status.Refused,
        );
      });
    });
  });

  describe('Given a non-existent payment ID', () => {
    describe('When execute is called', () => {
      it('Should throw NotFoundException', async () => {
        // Arrange
        const paymentId = 'pay_999';
        const command = new UpdateCheckoutStatusCommand(paymentId);

        paymentGateway.getByArgs.mockResolvedValueOnce(null);

        // Act & Assert
        await expect(handler.execute(command)).rejects.toThrow(
          new NotFoundException('Payment not found'),
        );
        expect(paymentGateway.getByArgs).toHaveBeenCalledWith(paymentId);
        expect(checkoutRepository.getByOrderId).not.toHaveBeenCalled();
        expect(sqsService.sendMessage).not.toHaveBeenCalled();
      });
    });
  });

  describe('Given a payment with no associated checkout', () => {
    describe('When execute is called', () => {
      it('Should throw NotFoundException', async () => {
        // Arrange
        const paymentId = 'pay_789';
        const command = new UpdateCheckoutStatusCommand(paymentId);

        const mockPayment = {
          id: paymentId,
          orderId: 'order_103',
          status: 'approved',
        };

        paymentGateway.getByArgs.mockResolvedValueOnce(mockPayment);
        checkoutRepository.getByOrderId.mockResolvedValueOnce(null);

        // Act & Assert
        await expect(handler.execute(command)).rejects.toThrow(
          new NotFoundException('Checkout not found'),
        );
        expect(paymentGateway.getByArgs).toHaveBeenCalledWith(paymentId);
        expect(checkoutRepository.getByOrderId).toHaveBeenCalledWith(
          mockPayment.orderId,
        );
        expect(sqsService.sendMessage).not.toHaveBeenCalled();
      });
    });
  });

  describe('Given an unsuccessful checkout update', () => {
    describe('When execute is called', () => {
      it('Should throw UpdateFailedException', async () => {
        // Arrange
        const paymentId = 'pay_123';
        const orderId = 'order_101';
        const command = new UpdateCheckoutStatusCommand(paymentId);

        const mockPayment = {
          id: paymentId,
          orderId,
          status: 'approved',
        };

        const mockCheckout: Partial<CheckoutEntity> = {
          id: 1,
          paymentId: paymentId,
          paymentCode: 'PC123',
          status: Status.WaitingPayment,
          orderId,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          changeData: jest.fn(),
        };

        paymentGateway.getByArgs.mockResolvedValueOnce(mockPayment);
        checkoutRepository.getByOrderId.mockResolvedValueOnce(
          mockCheckout as CheckoutEntity,
        );
        checkoutRepository.update.mockResolvedValueOnce(null);

        // Act & Assert
        await expect(handler.execute(command)).rejects.toThrow(
          new UpdateFailedException('Checkout', mockCheckout.id),
        );
        expect(paymentGateway.getByArgs).toHaveBeenCalledWith(paymentId);
        expect(checkoutRepository.getByOrderId).toHaveBeenCalledWith(
          mockPayment.orderId,
        );
        expect(mockCheckout.changeData).toHaveBeenCalled();
        expect(checkoutRepository.update).toHaveBeenCalledWith(
          mockCheckout.id,
          mockCheckout,
        );
        expect(sqsService.sendMessage).not.toHaveBeenCalled();
      });
    });
  });
});
