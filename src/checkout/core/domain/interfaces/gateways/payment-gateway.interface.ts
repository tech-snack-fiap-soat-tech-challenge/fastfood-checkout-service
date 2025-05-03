export type PaymentInput = {
  orderId: number;
  customerId: number;
  amount: number;
};

export type PaymentOutput = {
  id: string;
  orderId: number;
  status: string;
  qrCode: string;
};

export interface IPaymentGateway {
  create(payment: PaymentInput): Promise<PaymentOutput>;
  getByArgs(id: number): Promise<Omit<PaymentOutput, 'qrCode'>>;
}

export const IPaymentGateway = Symbol('IPaymentGateway');
