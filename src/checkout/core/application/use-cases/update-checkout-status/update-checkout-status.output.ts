import { CheckoutEntity } from '@app/checkout/core/domain/entities/checkout.entity';
import { CheckoutOutput } from '../../dtos/checkout.output';

export class UpdateCheckoutStatusOutput {
  checkout: CheckoutOutput;

  constructor(entity: CheckoutEntity) {
    this.checkout = new CheckoutOutput(entity);
  }
}
