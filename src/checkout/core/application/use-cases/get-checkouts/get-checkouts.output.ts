import { CheckoutEntity } from '@app/checkout/core/domain/entities/checkout.entity';
import { CheckoutOutput } from '../../dtos/checkout.output';

export class GetCheckoutsOutput {
  checkouts: CheckoutOutput[];

  constructor(entities: CheckoutEntity[]) {
    this.checkouts = entities.map((entity) => {
      return new CheckoutOutput(entity);
    });
  }
}
