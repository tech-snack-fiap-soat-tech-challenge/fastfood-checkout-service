import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommonModule } from '@app/common/common.module';
import { DomainExceptionsFilter } from '@app/common/filters/domain-exceptions.filter';
import { GetCheckoutByOrderIdHandler } from '@checkout/core/application/use-cases/get-checkout-by-order-id/get-checkout-by-order-id.handle';
import { CheckoutController } from './api/controllers/checkout.controller';
import { OrderCreatedHandler } from './core/application/listeners/order/order-created.handler';
import { OrderCreatedListener } from './core/application/listeners/order/order-created.listener';
import { GetCheckoutsHandle } from './core/application/use-cases/get-checkouts/get-checkouts.handle';
import { UpdateCheckoutStatusHandler } from './core/application/use-cases/update-checkout-status/update-checkout-status.handler';
import { CheckoutEntity } from './core/domain/entities/checkout.entity';
import { IPaymentGateway } from './core/domain/interfaces/gateways/payment-gateway.interface';
import { ICheckoutRepository } from './core/domain/interfaces/repositories/checkout.repository.interface';
import { MercadoPagoGateway } from './infrastructure/adapters/gateways/mercado-pago.gateway';
import { CheckoutRepository } from './infrastructure/adapters/repositories/checkout.repository';

const handlers = [
  GetCheckoutsHandle,
  UpdateCheckoutStatusHandler,
  GetCheckoutByOrderIdHandler,
  OrderCreatedHandler,
];

const listeners = [OrderCreatedListener];

@Module({
  imports: [
    TypeOrmModule.forFeature([CheckoutEntity]),
    CqrsModule,
    CommonModule,
  ],
  controllers: [CheckoutController],
  providers: [
    ...handlers,
    ...listeners,
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
