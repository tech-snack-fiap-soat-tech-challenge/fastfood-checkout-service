import { BaseEntity } from '@app/common/domain/entities/base.entity';
import { Column, Entity } from 'typeorm';
import { Status } from '../../application/enums/status.enum';

@Entity('checkout')
export class CheckoutEntity extends BaseEntity {
  @Column({ name: 'payment_id', type: 'varchar' })
  paymentId: string;

  @Column({ name: 'payment_code', type: 'varchar' })
  paymentCode: string;

  @Column({ name: 'status', type: 'varchar', length: 100 })
  status: string;

  @Column({ name: 'order_id', type: 'integer', nullable: true })
  orderId: string;

  static createInstance(
    data: Pick<CheckoutEntity, 'paymentId' | 'paymentCode' | 'orderId'>,
  ) {
    const checkout = new CheckoutEntity();
    checkout.paymentId = data.paymentId;
    checkout.paymentCode = data.paymentCode;
    checkout.status = Status.WaitingPayment;
    checkout.orderId = data.orderId;

    return checkout;
  }

  changeData(
    data: Pick<
      CheckoutEntity,
      'paymentId' | 'paymentCode' | 'status' | 'orderId'
    >,
  ): void {
    const { paymentId, paymentCode, status, orderId } = data;
    this.paymentId = paymentId ?? this.paymentId;
    this.paymentCode = paymentCode ?? this.paymentCode;
    this.status = status ?? this.status;
    this.orderId = orderId ?? this.orderId;
  }

  paidCheckout(): void {
    this.status = Status.Paid;
  }
}
