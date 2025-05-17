import { MercadoPagoGateway } from '@app/checkout/infrastructure/adapters/gateways/mercado-pago.gateway';
import {
  PaymentInput,
  PaymentOutput,
} from '@checkout/core/domain/interfaces/gateways/payment-gateway.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { Payment } from 'mercadopago';

describe('MercadoPagoGateway', () => {
  let gateway: MercadoPagoGateway;
  let paymentMock: jest.Mocked<Payment>;

  const mockPaymentResponse: PaymentOutput = {
    id: '12345',
    status: 'pending',
    qrCode:
      '00020126600014br.gov.bcb.pix0117test@testuser.com0217dados adicionais520400005303986540510.005802BR5913Maria Silva6008Brasilia62070503***6304E2CA',
    orderId: '123',
  };

  // Helper function to flush promises
  const flushPromises = () =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    new Promise(jest.requireActual('timers').setImmediate);

  beforeEach(async () => {
    jest.useFakeTimers({ timerLimit: 10 });
    jest.mock('mercadopago', () => {
      return {
        MercadoPagoConfig: jest.fn().mockImplementation(() => ({})),
        Payment: jest.fn().mockImplementation(() => ({
          create: jest.fn(),
          get: jest.fn(),
        })),
      };
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [MercadoPagoGateway],
    }).compile();

    gateway = module.get<MercadoPagoGateway>(MercadoPagoGateway);

    // Access and mock the private paymentGateway property
    paymentMock = gateway['paymentGateway'] as unknown as jest.Mocked<Payment>;
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('Given a valid payment input', () => {
      describe('When create is called', () => {
        it('Should return a successful payment output with QR code', async () => {
          // Arrange
          const paymentInput: PaymentInput = {
            orderId: '123',
            customerId: 456,
            amount: 10.99,
          };

          // Act
          const promise = gateway.create(paymentInput);
          jest.advanceTimersByTime(300);
          await flushPromises();

          const result = await promise;

          // Assert
          expect(result).toEqual(mockPaymentResponse);
        });
      });
    });

    describe('Given an error occurs during payment creation', () => {
      describe('When create is called', () => {
        it('Should throw the error', async () => {
          // Arrange
          const paymentInput: PaymentInput = {
            orderId: '123',
            customerId: 456,
            amount: 10.99,
          };

          jest.spyOn(global, 'setTimeout').mockImplementation(() => {
            throw new Error('Payment creation failed');
          });

          // Act & Assert
          await expect(gateway.create(paymentInput)).rejects.toThrow(
            'Payment creation failed',
          );
        });
      });
    });
  });

  describe('getByArgs', () => {
    describe('Given a valid payment ID', () => {
      describe('When getByArgs is called', () => {
        it('Should return payment details without QR code', async () => {
          // Arrange
          const paymentId = '12345';

          // Act
          const promise = gateway.getByArgs(paymentId);
          jest.advanceTimersByTime(300);
          await flushPromises();

          const result = await promise;

          // Assert
          expect(result).toEqual({
            id: '12345',
            status: 'approved',
            orderId: paymentId,
          });
        });
      });
    });

    describe('Given an error occurs when retrieving payment', () => {
      describe('When getByArgs is called', () => {
        it('Should throw the error', async () => {
          // Arrange
          const paymentId = '12345';

          jest.spyOn(global, 'setTimeout').mockImplementation(() => {
            throw new Error('Payment retrieval failed');
          });

          // Act & Assert
          await expect(gateway.getByArgs(paymentId)).rejects.toThrow(
            'Payment retrieval failed',
          );
        });
      });
    });
  });
});
