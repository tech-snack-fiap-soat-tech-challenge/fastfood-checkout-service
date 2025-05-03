import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetCheckoutsOutput } from './get-checkouts.output';
import { ICheckoutRepository } from '@app/checkout/core/domain/interfaces/repositories/checkout.repository.interface';
import { GetCheckoutsQuery } from './get-checkouts.query';

@QueryHandler(GetCheckoutsQuery)
export class GetCheckoutsHandle
  implements IQueryHandler<GetCheckoutsQuery, GetCheckoutsOutput>
{
  constructor(
    @Inject(ICheckoutRepository)
    private checkoutRepository: ICheckoutRepository,
  ) {}
  async execute(): Promise<GetCheckoutsOutput> {
    const data = await this.checkoutRepository.getAll();

    return new GetCheckoutsOutput(data);
  }
}
