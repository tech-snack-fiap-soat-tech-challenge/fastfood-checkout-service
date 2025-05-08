import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';

import { ICheckoutRepository } from '@checkout/core/domain/interfaces/repositories/checkout.repository.interface';
import { GetCheckoutByOrderIdQuery } from './get-checkout-by-order-id.query';
import { GetCheckoutByOrderIdOutput } from './get-checkout-by-order-id.output';

@QueryHandler(GetCheckoutByOrderIdQuery)
export class GetCheckoutByOrderIdHandler
  implements
    IQueryHandler<GetCheckoutByOrderIdQuery, GetCheckoutByOrderIdOutput>
{
  constructor(
    @Inject(ICheckoutRepository)
    private readonly checkoutRepository: ICheckoutRepository,
  ) {}

  async execute(
    query: GetCheckoutByOrderIdQuery,
  ): Promise<GetCheckoutByOrderIdOutput> {
    const { orderId } = query;
    const checkout = await this.checkoutRepository.getByOrderId(orderId);

    if (!checkout) {
      throw new NotFoundException('Checkout not found');
    }

    return new GetCheckoutByOrderIdOutput(checkout);
  }
}
