import { Injectable } from '@nestjs/common';

import {
  IPaymentGateway,
  PaymentInput,
  PaymentOutput,
} from '@checkout/core/domain/interfaces/gateways/payment-gateway.interface';
import { MercadoPagoConfig, Payment } from 'mercadopago';

type MercadoPagoCreatePaymentResponse = {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  metadata: {
    order_id: string;
  };
  point_of_interaction: {
    transaction_data: {
      qr_code: string;
    };
  };
};

type MercadoPagoGetPaymentResponse = Omit<
  MercadoPagoCreatePaymentResponse,
  'point_of_interaction'
>;

@Injectable()
export class MercadoPagoGateway implements IPaymentGateway {
  private readonly paymentMethodId = 'pix';
  private readonly paymentGateway: Payment;

  constructor() {
    const client = new MercadoPagoConfig({
      accessToken: process.env.PAYMENT_GATEWAY_ACCESS_TOKEN,
    });

    this.paymentGateway = new Payment(client);
  }

  async create(payment: PaymentInput): Promise<PaymentOutput> {
    try {
      /*const gatewayResponse = await this.paymentGateway.create({
        requestOptions: {
          idempotencyKey: crypto.randomUUID(),
        },
        body: {
          payment_method_id: this.paymentMethodId,
          notification_url: process.env.PAYMENT_NOTIFICATION_URL,
          transaction_amount: payment.amount,
          metadata: {
            order_id: payment.orderId,
          },
          payer: {
            id: payment.customerId.toString(),
            email: 'test@test.com',
          },
        },
      });*/

      //mocked response
      const gatewayResponse =
        await new Promise<MercadoPagoCreatePaymentResponse>((resolve) => {
          setTimeout(() => {
            resolve({
              id: 12345,
              status: 'pending' as 'pending' | 'approved' | 'rejected',
              metadata: { order_id: payment.orderId },
              point_of_interaction: {
                transaction_data: {
                  qr_code:
                    '00020126600014br.gov.bcb.pix0117test@testuser.com0217dados adicionais520400005303986540510.005802BR5913Maria Silva6008Brasilia62070503***6304E2CA',
                },
              },
            });
          }, 300);
        });

      return {
        id: gatewayResponse.id.toString(),
        status: gatewayResponse.status,
        qrCode: gatewayResponse.point_of_interaction.transaction_data.qr_code,
        orderId: gatewayResponse.metadata.order_id,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getByArgs(id: number | string): Promise<Omit<PaymentOutput, 'qrCode'>> {
    try {
      /*const gatewayResponse = await this.paymentGateway.get({
        id,
        requestOptions: {
          idempotencyKey: crypto.randomUUID(),
        },
      });*/

      //mocked response
      const gatewayResponse = await new Promise<MercadoPagoGetPaymentResponse>(
        (resolve) => {
          setTimeout(() => {
            resolve({
              id: 12345,
              status: 'approved' as 'pending' | 'approved' | 'rejected',
              metadata: { order_id: '25' },
            });
          }, 300);
        },
      );

      return {
        id: gatewayResponse.id.toString(),
        status: gatewayResponse.status,
        orderId: gatewayResponse.metadata.order_id,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
