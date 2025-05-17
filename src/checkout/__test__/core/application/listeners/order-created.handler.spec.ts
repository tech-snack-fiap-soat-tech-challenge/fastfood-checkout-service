import { Test, TestingModule } from '@nestjs/testing';
import { OrderCreatedHandler } from '@checkout/core/application/listeners/order/order-created.handler';
import { IPaymentGateway } from '@checkout/core/domain/interfaces/gateways/payment-gateway.interface';
import { ICheckoutRepository } from '@checkout/core/domain/interfaces/repositories/checkout.repository.interface';
import { OrderCreatedEvent } from '@common/domain/events/order-created.event';
import { CheckoutEntity } from '@checkout/core/domain/entities/checkout.entity';

describe('OrderCreatedHandler', () => {
  let handler: OrderCreatedHandler;
  let checkoutRepository: jest.Mocked<ICheckoutRepository>;
  let paymentGateway: jest.Mocked<IPaymentGateway>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderCreatedHandler,
        {
          provide: ICheckoutRepository,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: IPaymentGateway,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<OrderCreatedHandler>(OrderCreatedHandler);
    checkoutRepository = module.get(ICheckoutRepository);
    paymentGateway = module.get(IPaymentGateway);
  });

  describe('Given a valid OrderCreatedEvent', () => {
    describe('When handle is called', () => {
      it('Should create a payment and a checkout', async () => {
        // Arrange
        const event = new OrderCreatedEvent('123', 789, 50.0);

        const paymentResponse = {
          id: '456',
          orderId: '123',
          qrCode: 'QRCODE123',
          status: 'pending',
        };

        const createdCheckout = {
          id: 1,
          orderId: event.orderId,
          paymentId: paymentResponse.id.toString(),
          paymentCode: paymentResponse.qrCode,
        };

        // Mock the static createInstance method
        jest
          .spyOn(CheckoutEntity, 'createInstance')
          .mockReturnValueOnce(createdCheckout as CheckoutEntity);

        paymentGateway.create.mockResolvedValueOnce(paymentResponse);
        checkoutRepository.create.mockResolvedValueOnce(
          createdCheckout as CheckoutEntity,
        );

        // Act
        await handler.handle(event);

        // Assert
        expect(paymentGateway.create).toHaveBeenCalledWith(event);
        expect(CheckoutEntity.createInstance).toHaveBeenCalledWith({
          orderId: event.orderId,
          paymentId: paymentResponse.id.toString(),
          paymentCode: paymentResponse.qrCode,
        });
        expect(checkoutRepository.create).toHaveBeenCalledWith(createdCheckout);
      });
    });
  });

  describe('Given the payment gateway throws an error', () => {
    describe('When handle is called', () => {
      it('Should propagate the error and not create a checkout', async () => {
        // Arrange
        const event = new OrderCreatedEvent('123', 789, 50.0);

        const error = new Error('Payment gateway error');
        paymentGateway.create.mockRejectedValueOnce(error);

        // Don't need to spy on CheckoutEntity.createInstance as it shouldn't be called

        // Act & Assert
        await expect(handler.handle(event)).rejects.toThrow(
          'Payment gateway error',
        );
        expect(paymentGateway.create).toHaveBeenCalledWith(event);
        expect(checkoutRepository.create).not.toHaveBeenCalled();
      });
    });
  });

  describe('Given the checkout repository throws an error', () => {
    describe('When handle is called', () => {
      it('Should propagate the error after creating a payment', async () => {
        // Arrange
        const event = new OrderCreatedEvent('123', 789, 50.0);

        const paymentResponse = {
          id: '456',
          orderId: '123',
          qrCode: 'QRCODE123',
          status: 'pending',
        };

        const createdCheckout = {
          id: 1,
          orderId: event.orderId,
          paymentId: paymentResponse.id.toString(),
          paymentCode: paymentResponse.qrCode,
        };

        jest
          .spyOn(CheckoutEntity, 'createInstance')
          .mockReturnValueOnce(createdCheckout as CheckoutEntity);

        paymentGateway.create.mockResolvedValueOnce(paymentResponse);
        checkoutRepository.create.mockRejectedValueOnce(
          new Error('Repository error'),
        );

        // Act & Assert
        await expect(handler.handle(event)).rejects.toThrow('Repository error');
        expect(paymentGateway.create).toHaveBeenCalledWith(event);
        expect(CheckoutEntity.createInstance).toHaveBeenCalledWith({
          orderId: event.orderId,
          paymentId: paymentResponse.id.toString(),
          paymentCode: paymentResponse.qrCode,
        });
        expect(checkoutRepository.create).toHaveBeenCalledWith(createdCheckout);
      });
    });
  });
});
