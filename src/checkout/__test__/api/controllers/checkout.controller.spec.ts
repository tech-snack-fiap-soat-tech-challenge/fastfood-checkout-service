import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CheckoutController } from '@app/checkout/api/controllers/checkout.controller';
import { CheckoutOutput } from '@app/checkout/core/application/dtos/checkout.output';
import { GetCheckoutsOutput } from '@app/checkout/core/application/use-cases/get-checkouts/get-checkouts.output';
import { GetCheckoutsQuery } from '@app/checkout/core/application/use-cases/get-checkouts/get-checkouts.query';
import { UpdateCheckoutStatusRequest } from '@app/checkout/api/dtos/update-checkout-status-.request';
import { UpdateCheckoutStatusOutput } from '@app/checkout/core/application/use-cases/update-checkout-status/update-checkout-status.output';
import { GetCheckoutByOrderIdOutput } from '@app/checkout/core/application/use-cases/get-checkout-by-order-id/get-checkout-by-order-id.output';
import { UpdateCheckoutStatusCommand } from '@app/checkout/core/application/use-cases/update-checkout-status/update-checkout-status.command';
import { GetCheckoutByOrderIdQuery } from '@app/checkout/core/application/use-cases/get-checkout-by-order-id/get-checkout-by-order-id.query';

describe('CheckoutController', () => {
  let controller: CheckoutController;
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  beforeEach(async () => {
    // Arrange: Create a testing module and mock dependencies
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CheckoutController],
      providers: [
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: QueryBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CheckoutController>(CheckoutController);
    commandBus = module.get<CommandBus>(CommandBus);
    queryBus = module.get<QueryBus>(QueryBus);
  });

  describe('getAllCheckouts', () => {
    it('should return all checkouts from the queryBus', async () => {
      // Arrange
      const mockCheckouts: CheckoutOutput[] = [
        {
          id: 1,
          paymentId: 'pay_123',
          paymentCode: 'PC123',
          status: 'pending',
          orderId: 'order_123',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
        {
          id: 2,
          paymentId: 'pay_456',
          paymentCode: 'PC456',
          status: 'paid',
          orderId: 'order_124',
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-02'),
        },
      ];

      const expectedOutput: GetCheckoutsOutput = {
        checkouts: mockCheckouts,
      };

      jest.spyOn(queryBus, 'execute').mockResolvedValueOnce(expectedOutput);

      // Act
      const result = await controller.getAllCheckouts();

      // Assert
      expect(queryBus.execute).toHaveBeenCalledWith(new GetCheckoutsQuery());
      expect(result).toEqual(mockCheckouts);
    });
  });

  describe('paymentStatusUpdate', () => {
    describe('when action is not "payment.updated"', () => {
      it('should return undefined and not call CommandBus.execute', async () => {
        // Arrange
        const paymentId = 'pay_123';
        const input: UpdateCheckoutStatusRequest = {
          action: 'some.other.action',
          data: { id: paymentId },
          id: paymentId,
        };
        const spy = jest.spyOn(commandBus, 'execute');

        // Act
        const result = await controller.paymentStatusUpdate(input);

        // Assert
        expect(result).toBeUndefined();
        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe('when action is "payment.updated"', () => {
      it('should call CommandBus.execute with the correct command and return the result', async () => {
        // Arrange
        const paymentId = 'pay_123';
        const input: UpdateCheckoutStatusRequest = {
          action: 'payment.updated',
          data: { id: paymentId },
          id: paymentId,
        };

        const expectedOutput: UpdateCheckoutStatusOutput = {
          checkout: {
            id: 123,
            paymentId: 'pay_123',
            paymentCode: 'PC123',
            status: 'paid',
            orderId: 'order_123',
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-02'),
          },
        };

        jest.spyOn(commandBus, 'execute').mockResolvedValueOnce(expectedOutput);

        // Act
        const result = await controller.paymentStatusUpdate(input);

        // Assert
        expect(commandBus.execute).toHaveBeenCalledWith(
          new UpdateCheckoutStatusCommand(paymentId),
        );
        expect(result).toEqual(expectedOutput);
      });
    });
  });

  describe('getCheckoutByOrder', () => {
    it('should return the checkout for the specified order ID', async () => {
      // Arrange
      const orderId = 'order_123';

      const mockCheckout: CheckoutOutput = {
        id: 1,
        paymentId: 'pay_123',
        paymentCode: 'PC123',
        status: 'paid',
        orderId: orderId,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      };

      const expectedOutput: GetCheckoutByOrderIdOutput = {
        checkout: mockCheckout,
      };

      jest.spyOn(queryBus, 'execute').mockResolvedValueOnce(expectedOutput);

      // Act
      const result = await controller.getCheckoutByOrder(orderId);

      // Assert
      expect(queryBus.execute).toHaveBeenCalledWith(
        new GetCheckoutByOrderIdQuery(orderId),
      );
      expect(result).toEqual(mockCheckout);
    });
  });
});
