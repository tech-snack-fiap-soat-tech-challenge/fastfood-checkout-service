import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetCheckoutByOrderIdHandler } from '@app/checkout/core/application/use-cases/get-checkout-by-order-id/get-checkout-by-order-id.handle';
import { ICheckoutRepository } from '@app/checkout/core/domain/interfaces/repositories/checkout.repository.interface';
import { GetCheckoutByOrderIdQuery } from '@app/checkout/core/application/use-cases/get-checkout-by-order-id/get-checkout-by-order-id.query';
import { CheckoutEntity } from '@app/checkout/core/domain/entities/checkout.entity';
import { GetCheckoutByOrderIdOutput } from '@app/checkout/core/application/use-cases/get-checkout-by-order-id/get-checkout-by-order-id.output';

describe('GetCheckoutByOrderIdHandler', () => {
  let handler: GetCheckoutByOrderIdHandler;
  let checkoutRepository: jest.Mocked<ICheckoutRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCheckoutByOrderIdHandler,
        {
          provide: ICheckoutRepository,
          useValue: {
            getByOrderId: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetCheckoutByOrderIdHandler>(
      GetCheckoutByOrderIdHandler,
    );
    checkoutRepository = module.get(ICheckoutRepository);
  });

  describe('Given a checkout exists for the provided order ID', () => {
    describe('When execute is called', () => {
      it('Should return checkout data wrapped in GetCheckoutByOrderIdOutput', async () => {
        // Arrange
        const orderId = 'order_123';
        const query = new GetCheckoutByOrderIdQuery(orderId);

        const mockCheckout: Partial<CheckoutEntity> = {
          id: 1,
          paymentId: 'pay_123',
          paymentCode: 'PC123',
          status: 'paid',
          orderId: orderId,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
        };

        checkoutRepository.getByOrderId.mockResolvedValueOnce(
          mockCheckout as CheckoutEntity,
        );

        // Act
        const result = await handler.execute(query);

        // Assert
        expect(checkoutRepository.getByOrderId).toHaveBeenCalledWith(orderId);
        expect(result).toBeInstanceOf(GetCheckoutByOrderIdOutput);
        expect(result.checkout).toEqual(mockCheckout);
      });
    });
  });

  describe('Given no checkout exists for the provided order ID', () => {
    describe('When execute is called', () => {
      it('Should throw NotFoundException', async () => {
        // Arrange
        const orderId = 'order_999';
        const query = new GetCheckoutByOrderIdQuery(orderId);

        checkoutRepository.getByOrderId.mockResolvedValueOnce(null);

        // Act & Assert
        await expect(handler.execute(query)).rejects.toThrow(
          new NotFoundException('Checkout not found'),
        );
        expect(checkoutRepository.getByOrderId).toHaveBeenCalledWith(orderId);
      });
    });
  });

  describe('Given repository throws an error', () => {
    describe('When execute is called', () => {
      it('Should propagate the error', async () => {
        // Arrange
        const orderId = 'order_123';
        const query = new GetCheckoutByOrderIdQuery(orderId);
        const error = new Error('Database error');

        checkoutRepository.getByOrderId.mockRejectedValueOnce(error);

        // Act & Assert
        await expect(handler.execute(query)).rejects.toThrow('Database error');
        expect(checkoutRepository.getByOrderId).toHaveBeenCalledWith(orderId);
      });
    });
  });
});
