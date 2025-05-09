import { CheckoutEntity } from '@app/checkout/core/domain/entities/checkout.entity';
import { CheckoutRepository } from '@app/checkout/infrastructure/adapters/repositories/checkout.repository';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('CheckoutRepository', () => {
  let repository: CheckoutRepository;
  let typeOrmRepository: jest.Mocked<Repository<CheckoutEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutRepository,
        {
          provide: getRepositoryToken(CheckoutEntity),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<CheckoutRepository>(CheckoutRepository);
    typeOrmRepository = module.get(getRepositoryToken(CheckoutEntity));
  });

  describe('getAll', () => {
    describe('Given there are checkouts in the database', () => {
      describe('When getAll is called', () => {
        it('Should return all checkout entities', async () => {
          // Arrange
          const mockCheckouts: CheckoutEntity[] = [
            {
              id: 1,
              orderId: 101,
              paymentId: 'pay_123',
              paymentCode: 'PC123',
              status: 'paid',
            } as CheckoutEntity,
            {
              id: 2,
              orderId: 102,
              paymentId: 'pay_456',
              paymentCode: 'PC456',
              status: 'pending',
            } as CheckoutEntity,
          ];
          typeOrmRepository.find.mockResolvedValueOnce(mockCheckouts);

          // Act
          const result = await repository.getAll();

          // Assert
          expect(typeOrmRepository.find).toHaveBeenCalled();
          expect(result).toEqual(mockCheckouts);
          expect(result.length).toBe(2);
        });
      });
    });
  });

  describe('getById', () => {
    describe('Given a checkout exists with the provided id', () => {
      describe('When getById is called', () => {
        it('Should return the checkout entity', async () => {
          // Arrange
          const mockId = 1;
          const mockCheckout = {
            id: mockId,
            orderId: 101,
            paymentId: 'pay_123',
            paymentCode: 'PC123',
            status: 'paid',
            order: { id: 101, items: [] },
          } as Partial<CheckoutEntity>;

          typeOrmRepository.findOne.mockResolvedValueOnce(
            mockCheckout as CheckoutEntity,
          );

          // Act
          const result = await repository.getById(mockId);

          // Assert
          expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
            where: { id: mockId },
            relations: ['order'],
          });
          expect(result).toEqual(mockCheckout);
        });
      });
    });

    describe('Given no checkout exists with the provided id', () => {
      describe('When getById is called', () => {
        it('Should return null', async () => {
          // Arrange
          const mockId = 999;
          typeOrmRepository.findOne.mockResolvedValueOnce(null);

          // Act
          const result = await repository.getById(mockId);

          // Assert
          expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
            where: { id: mockId },
            relations: ['order'],
          });
          expect(result).toBeNull();
        });
      });
    });
  });

  describe('create', () => {
    describe('Given a valid checkout entity', () => {
      describe('When create is called', () => {
        it('Should save and return the new checkout entity', async () => {
          // Arrange
          const mockCheckout = {
            orderId: 101,
            paymentId: 'pay_123',
            paymentCode: 'PC123',
            status: 'pending',
          } as CheckoutEntity;

          const savedMockCheckout = {
            id: 1,
            ...mockCheckout,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as CheckoutEntity;

          typeOrmRepository.save.mockResolvedValueOnce(savedMockCheckout);

          // Act
          const result = await repository.create(mockCheckout);

          // Assert
          expect(typeOrmRepository.save).toHaveBeenCalledWith(mockCheckout);
          expect(result).toEqual(savedMockCheckout);
          expect(result.id).toBe(1);
        });
      });
    });
  });

  describe('update', () => {
    describe('Given a checkout exists with the provided id', () => {
      describe('When update is called', () => {
        it('Should update and return the updated checkout entity', async () => {
          // Arrange
          const mockId = 1;
          const updatePayload = {
            status: 'paid',
          };

          const updatedCheckout = {
            id: mockId,
            orderId: 101,
            paymentId: 'pay_123',
            paymentCode: 'PC123',
            status: 'paid',
            order: { id: 101, items: [] },
            updatedAt: new Date(),
          } as Partial<CheckoutEntity>;

          typeOrmRepository.update.mockResolvedValueOnce(undefined);
          typeOrmRepository.findOne.mockResolvedValueOnce(
            updatedCheckout as CheckoutEntity,
          );

          // Act
          const result = await repository.update(mockId, updatePayload);

          // Assert
          expect(typeOrmRepository.update).toHaveBeenCalledWith(
            mockId,
            updatePayload,
          );
          expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
            where: { id: mockId },
            relations: ['order'],
          });
          expect(result).toEqual(updatedCheckout);
          expect(result.status).toBe('paid');
        });
      });
    });
  });

  describe('getByOrderId', () => {
    describe('Given a checkout exists with the provided orderId', () => {
      describe('When getByOrderId is called', () => {
        it('Should return the checkout entity', async () => {
          // Arrange
          const mockOrderId = 101;
          const mockCheckout = {
            id: 1,
            orderId: mockOrderId,
            paymentId: 'pay_123',
            paymentCode: 'PC123',
            status: 'paid',
            order: { id: mockOrderId, items: [] },
          } as Partial<CheckoutEntity>;

          typeOrmRepository.findOne.mockResolvedValueOnce(
            mockCheckout as CheckoutEntity,
          );

          // Act
          const result = await repository.getByOrderId(mockOrderId);

          // Assert
          expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
            where: { orderId: mockOrderId },
            relations: ['order'],
          });
          expect(result).toEqual(mockCheckout);
          expect(result.orderId).toBe(mockOrderId);
        });
      });
    });

    describe('Given no checkout exists with the provided orderId', () => {
      describe('When getByOrderId is called', () => {
        it('Should return null', async () => {
          // Arrange
          const mockOrderId = 999;
          typeOrmRepository.findOne.mockResolvedValueOnce(null);

          // Act
          const result = await repository.getByOrderId(mockOrderId);

          // Assert
          expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
            where: { orderId: mockOrderId },
            relations: ['order'],
          });
          expect(result).toBeNull();
        });
      });
    });
  });
});
