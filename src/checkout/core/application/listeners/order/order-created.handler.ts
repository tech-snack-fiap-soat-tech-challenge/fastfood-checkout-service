import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';

import { OrderCreatedEvent } from '@common/domain/events/order-created.event';
import { IPaymentGateway } from '@checkout/core/domain/interfaces/gateways/payment-gateway.interface';
import { ICheckoutRepository } from '@checkout/core/domain/interfaces/repositories/checkout.repository.interface';
import { CheckoutEntity } from '@checkout/core/domain/entities/checkout.entity';

@EventsHandler(OrderCreatedEvent)
export class OrderCreatedHandler implements IEventHandler<OrderCreatedEvent> {
  constructor(
    @Inject(ICheckoutRepository)
    private readonly checkoutRepository: ICheckoutRepository,
    @Inject(IPaymentGateway)
    private readonly paymentGateway: IPaymentGateway,
  ) {}

  async handle(event: OrderCreatedEvent) {
    console.log('OrderCreatedHandler', event);
    const payment = await this.paymentGateway.create(event);

    const checkout = CheckoutEntity.createInstance({
      orderId: event.orderId,
      paymentId: payment.id.toString(),
      paymentCode: payment.qrCode,
    });

    await this.checkoutRepository.create(checkout);
  }
}
