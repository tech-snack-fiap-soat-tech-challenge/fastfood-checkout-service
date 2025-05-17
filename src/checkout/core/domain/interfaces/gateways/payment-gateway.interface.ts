export type PaymentInput = {
  orderId: string;
  customerId: number;
  amount: number;
};

export type PaymentOutput = {
  id: string;
  orderId: string;
  status: string;
  qrCode: string;
};

export interface IPaymentGateway {
  create(payment: PaymentInput): Promise<PaymentOutput>;
  getByArgs(id: string): Promise<Omit<PaymentOutput, 'qrCode'>>;
}

export const IPaymentGateway = Symbol('IPaymentGateway');
