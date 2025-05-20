import { Test, TestingModule } from '@nestjs/testing';
import { ICheckoutRepository } from '@app/checkout/core/domain/interfaces/repositories/checkout.repository.interface';
import { CheckoutEntity } from '@app/checkout/core/domain/entities/checkout.entity';
import { GetCheckoutsHandle } from '@app/checkout/core/application/use-cases/get-checkouts/get-checkouts.handle';
import { GetCheckoutsOutput } from '@app/checkout/core/application/use-cases/get-checkouts/get-checkouts.output';

describe('GetCheckoutsHandle', () => {
  let handler: GetCheckoutsHandle;
  let checkoutRepository: jest.Mocked<ICheckoutRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCheckoutsHandle,
        {
          provide: ICheckoutRepository,
          useValue: {
            getAll: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetCheckoutsHandle>(GetCheckoutsHandle);
    checkoutRepository = module.get(ICheckoutRepository);
  });

  describe('execute', () => {
    it('Given the repository contains checkouts, when execute is called, then it should return all checkouts wrapped in GetCheckoutsOutput', async () => {
      // Arrange
      const mockCheckouts: Partial<CheckoutEntity>[] = [
        {
          id: 1,
          paymentId: 'pay_123',
          paymentCode: 'PC123',
          status: 'paid',
          orderId: 'order_101',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02'),
        },
        {
          id: 2,
          paymentId: 'pay_456',
          paymentCode: 'PC456',
          status: 'pending',
          orderId: 'order_102',
          createdAt: new Date('2023-01-03'),
          updatedAt: new Date('2023-01-03'),
        },
      ];

      checkoutRepository.getAll.mockResolvedValueOnce(
        mockCheckouts as CheckoutEntity[],
      );

      // Act
      const result = await handler.execute();

      // Assert
      expect(checkoutRepository.getAll).toHaveBeenCalled();
      expect(result).toBeInstanceOf(GetCheckoutsOutput);
      expect(result.checkouts).toEqual(mockCheckouts);
      expect(result.checkouts.length).toBe(2);
    });

    it('Given the repository is empty, when execute is called, then it should return an empty array', async () => {
      // Arrange
      const mockCheckouts: CheckoutEntity[] = [];
      checkoutRepository.getAll.mockResolvedValueOnce(mockCheckouts);

      // Act
      const result = await handler.execute();

      // Assert
      expect(checkoutRepository.getAll).toHaveBeenCalled();
      expect(result).toBeInstanceOf(GetCheckoutsOutput);
      expect(result.checkouts).toEqual([]);
      expect(result.checkouts.length).toBe(0);
    });

    it('Given the repository throws an error, when execute is called, then it should propagate the error', async () => {
      // Arrange
      const errorMessage = 'Database connection error';
      checkoutRepository.getAll.mockRejectedValueOnce(new Error(errorMessage));

      // Act & Assert
      await expect(handler.execute()).rejects.toThrow(errorMessage);
      expect(checkoutRepository.getAll).toHaveBeenCalled();
    });
  });
});
