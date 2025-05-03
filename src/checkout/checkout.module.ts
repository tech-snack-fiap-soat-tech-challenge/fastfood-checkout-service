import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { APP_FILTER } from '@nestjs/core';

import { DomainExceptionsFilter } from '@app/common/filters/domain-exceptions.filter';
import { CheckoutController } from './api/controllers/checkout.controller';
import { CheckoutEntity } from './core/domain/entities/checkout.entity';
import { ICheckoutRepository } from './core/domain/interfaces/repositories/checkout.repository.interface';
import { CheckoutRepository } from './infrastructure/adapters/repositories/checkout.repository';
import { GetCheckoutsHandle } from './core/application/use-cases/get-checkouts/get-checkouts.handle';
import { UpdateCheckoutStatusHandler } from './core/application/use-cases/update-checkout-status/update-checkout-status.handler';
import { GetCheckoutByOrderIdHandler } from '@checkout/core/application/use-cases/get-checkout-by-order-id/get-checkout-by-order-id.handle';
import { IPaymentGateway } from './core/domain/interfaces/gateways/payment-gateway.interface';
import { MercadoPagoGateway } from './infrastructure/adapters/gateways/mercado-pago.gateway';
import { OrderCreatedHandler } from './core/application/listeners/order/order-created.handler';

const handlers = [
  GetCheckoutsHandle,
  UpdateCheckoutStatusHandler,
  GetCheckoutByOrderIdHandler,
  OrderCreatedHandler,
];

@Module({
  imports: [TypeOrmModule.forFeature([CheckoutEntity]), CqrsModule],
  controllers: [CheckoutController],
  providers: [
    ...handlers,
    {
      provide: ICheckoutRepository,
      useClass: CheckoutRepository,
    },
    {
      provide: IPaymentGateway,
      useClass: MercadoPagoGateway,
    },
    {
      provide: APP_FILTER,
      useClass: DomainExceptionsFilter,
    },
  ],
})
export class CheckoutModule {}
