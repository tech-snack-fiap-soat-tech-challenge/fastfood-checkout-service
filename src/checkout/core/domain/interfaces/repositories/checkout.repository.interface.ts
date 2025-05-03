import { CheckoutEntity } from '../../entities/checkout.entity';

export interface ICheckoutRepository {
  getAll(): Promise<CheckoutEntity[]>;
  getById(id: number): Promise<CheckoutEntity>;
  getByOrderId(orderId: number): Promise<CheckoutEntity>;
  create(checkoutEntity: CheckoutEntity): Promise<CheckoutEntity>;
  update(id: number, payload: Partial<CheckoutEntity>): Promise<CheckoutEntity>;
}

export const ICheckoutRepository = Symbol('ICheckoutRepository');
