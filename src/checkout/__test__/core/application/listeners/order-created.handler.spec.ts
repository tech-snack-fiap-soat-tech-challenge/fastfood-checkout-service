import { Test, TestingModule } from '@nestjs/testing';
import { OrderCreatedHandler } from '@checkout/core/application/listeners/order/order-created.handler';
import {
  IPaymentGateway,
  PaymentOutput,
} from '@checkout/core/domain/interfaces/gateways/payment-gateway.interface';
import { ICheckoutRepository } from '@checkout/core/domain/interfaces/repositories/checkout.repository.interface';
import { OrderCreatedEvent } from '@common/domain/events/order-created.event';
import { CheckoutEntity } from '@checkout/core/domain/entities/checkout.entity';

describe('OrderCreatedHandler', () => {
  let handler: OrderCreatedHandler;
  let checkoutRepository: jest.Mocked<ICheckoutRepository>;
  let paymentGateway: jest.Mocked<IPaymentGateway>;

  // Test data constants
  const testOrderId = '123';
  const testCustomerId = 789;
  const testAmount = 50.0;
  const testPaymentId = '456';
  const testQrCode = 'QRCODE123';

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

  // Helper functions to reduce duplication
  const createOrderEvent = () => {
    return new OrderCreatedEvent(testOrderId, testCustomerId, testAmount);
  };

  const createPaymentResponse = (): PaymentOutput => {
    return {
      id: testPaymentId,
      orderId: testOrderId,
      qrCode: testQrCode,
      status: 'pending',
    };
  };

  const createCheckoutEntity = (paymentResponse: PaymentOutput) => {
    const checkout = {
      id: 1,
      orderId: testOrderId,
      paymentId: paymentResponse.id.toString(),
      paymentCode: paymentResponse.qrCode,
    };

    jest
      .spyOn(CheckoutEntity, 'createInstance')
      .mockReturnValueOnce(checkout as CheckoutEntity);

    return checkout;
  };

  describe('Given a valid OrderCreatedEvent', () => {
    describe('When handle is called', () => {
      it('Should create a payment and a checkout', async () => {
        // Arrange
        const event = createOrderEvent();
        const paymentResponse = createPaymentResponse();
        const createdCheckout = createCheckoutEntity(paymentResponse);

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
        const event = createOrderEvent();
        const error = new Error('Payment gateway error');

        paymentGateway.create.mockRejectedValueOnce(error);

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
        const event = createOrderEvent();
        const paymentResponse = createPaymentResponse();
        const createdCheckout = createCheckoutEntity(paymentResponse);

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
