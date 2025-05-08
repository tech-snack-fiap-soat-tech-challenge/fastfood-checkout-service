import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { UpdateCheckoutStatusHandler } from '@checkout/core/application/use-cases/update-checkout-status/update-checkout-status.handler';
import { ICheckoutRepository } from '@checkout/core/domain/interfaces/repositories/checkout.repository.interface';
import { IPaymentGateway } from '@checkout/core/domain/interfaces/gateways/payment-gateway.interface';
import { UpdateCheckoutStatusCommand } from '@checkout/core/application/use-cases/update-checkout-status/update-checkout-status.command';
import { UpdateFailedException } from '@common/exceptions/entity-update-failed.exception';
import { CheckoutUpdatedEvent } from '@common/domain/events/checkoutUpdatedEvent';
import { Status } from '@checkout/core/application/enums/status.enum';
import { CheckoutEntity } from '@checkout/core/domain/entities/checkout.entity';
import { CheckoutOutput } from '@app/checkout/core/application/dtos/checkout.output';

describe('UpdateCheckoutStatusHandler', () => {
  let handler: UpdateCheckoutStatusHandler;
  let checkoutRepository: jest.Mocked<ICheckoutRepository>;
  let paymentGateway: jest.Mocked<IPaymentGateway>;
  let eventBus: jest.Mocked<EventBus>;

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
          provide: EventBus,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<UpdateCheckoutStatusHandler>(
      UpdateCheckoutStatusHandler,
    );
    checkoutRepository = module.get(ICheckoutRepository);
    paymentGateway = module.get(IPaymentGateway);
    eventBus = module.get(EventBus);
  });

  describe('Given a valid payment ID with approved status', () => {
    describe('When execute is called', () => {
      it('Should update checkout status to paid and publish an event', async () => {
        // Arrange
        const paymentId = 123;
        const paymentIdString = paymentId.toString();
        const command = new UpdateCheckoutStatusCommand(paymentId);

        const mockPayment = {
          id: paymentIdString,
          orderId: 101,
          status: 'approved',
        };

        const mockCheckout: Partial<CheckoutEntity> = {
          id: 1,
          paymentId: paymentIdString,
          paymentCode: 'PC123',
          status: Status.WaitingPayment,
          orderId: 101,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          changeData: jest.fn(),
        };

        const updatedCheckout = {
          ...mockCheckout,
          status: Status.Paid,
          updatedAt: new Date('2023-01-02'),
        };

        paymentGateway.getByArgs.mockResolvedValueOnce(mockPayment);
        checkoutRepository.getByOrderId.mockResolvedValueOnce(
          mockCheckout as CheckoutEntity,
        );
        checkoutRepository.update.mockResolvedValueOnce(
          updatedCheckout as CheckoutEntity,
        );

        // Act
        const result = await handler.execute(command);

        // Assert
        expect(paymentGateway.getByArgs).toHaveBeenCalledWith(paymentId);
        expect(checkoutRepository.getByOrderId).toHaveBeenCalledWith(
          mockPayment.orderId,
        );
        expect(mockCheckout.changeData).toHaveBeenCalledWith({
          ...mockCheckout,
          status: Status.Paid,
        });
        expect(checkoutRepository.update).toHaveBeenCalledWith(
          mockCheckout.id,
          mockCheckout,
        );
        expect(eventBus.publish).toHaveBeenCalledWith(
          expect.any(CheckoutUpdatedEvent),
        );
        expect(result.checkout).toEqual(
          new CheckoutOutput(updatedCheckout as CheckoutEntity),
        );
      });
    });
  });

  describe('Given a valid payment ID with rejected status', () => {
    describe('When execute is called', () => {
      it('Should update checkout status to refused and publish an event', async () => {
        // Arrange
        const paymentId = 456;
        const paymentIdString = paymentId.toString();
        const command = new UpdateCheckoutStatusCommand(paymentId);

        const mockPayment = {
          id: paymentIdString,
          orderId: 102,
          status: 'rejected',
        };

        const mockCheckout: Partial<CheckoutEntity> = {
          id: 2,
          paymentId: paymentIdString,
          paymentCode: 'PC456',
          status: Status.WaitingPayment,
          orderId: 102,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          changeData: jest.fn(),
        };

        const updatedCheckout = {
          ...mockCheckout,
          status: Status.Refused,
          updatedAt: new Date('2023-01-02'),
        };

        paymentGateway.getByArgs.mockResolvedValueOnce(mockPayment);
        checkoutRepository.getByOrderId.mockResolvedValueOnce(
          mockCheckout as CheckoutEntity,
        );
        checkoutRepository.update.mockResolvedValueOnce(
          updatedCheckout as CheckoutEntity,
        );

        // Act
        const result = await handler.execute(command);

        // Assert
        expect(paymentGateway.getByArgs).toHaveBeenCalledWith(paymentId);
        expect(checkoutRepository.getByOrderId).toHaveBeenCalledWith(
          mockPayment.orderId,
        );
        expect(mockCheckout.changeData).toHaveBeenCalledWith({
          ...mockCheckout,
          status: Status.Refused,
        });
        expect(checkoutRepository.update).toHaveBeenCalledWith(
          mockCheckout.id,
          mockCheckout,
        );
        expect(eventBus.publish).toHaveBeenCalledWith(
          expect.any(CheckoutUpdatedEvent),
        );
        expect(result.checkout).toEqual(
          new CheckoutOutput(updatedCheckout as CheckoutEntity),
        );
      });
    });
  });

  describe('Given a non-existent payment ID', () => {
    describe('When execute is called', () => {
      it('Should throw NotFoundException', async () => {
        // Arrange
        const paymentId = 999;
        const command = new UpdateCheckoutStatusCommand(paymentId);

        paymentGateway.getByArgs.mockResolvedValueOnce(null);

        // Act & Assert
        await expect(handler.execute(command)).rejects.toThrow(
          new NotFoundException('Payment not found'),
        );
        expect(paymentGateway.getByArgs).toHaveBeenCalledWith(paymentId);
        expect(checkoutRepository.getByOrderId).not.toHaveBeenCalled();
      });
    });
  });

  describe('Given a payment with no associated checkout', () => {
    describe('When execute is called', () => {
      it('Should throw NotFoundException', async () => {
        // Arrange
        const paymentId = 789;
        const paymentIdString = paymentId.toString();
        const command = new UpdateCheckoutStatusCommand(paymentId);

        const mockPayment = {
          id: paymentIdString,
          orderId: 103,
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
      });
    });
  });

  describe('Given an unsuccessful checkout update', () => {
    describe('When execute is called', () => {
      it('Should throw UpdateFailedException', async () => {
        // Arrange
        const paymentId = 123;
        const paymentIdString = paymentId.toString();
        const command = new UpdateCheckoutStatusCommand(paymentId);

        const mockPayment = {
          id: paymentIdString,
          orderId: 101,
          status: 'approved',
        };

        const mockCheckout: Partial<CheckoutEntity> = {
          id: 1,
          paymentId: paymentIdString,
          paymentCode: 'PC123',
          status: Status.WaitingPayment,
          orderId: 101,
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
        expect(eventBus.publish).not.toHaveBeenCalled();
      });
    });
  });
});
