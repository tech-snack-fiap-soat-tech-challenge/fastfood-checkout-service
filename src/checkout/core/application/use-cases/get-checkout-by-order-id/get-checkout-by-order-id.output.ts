import { CheckoutOutput } from '@checkout/core/application/dtos/checkout.output';
import { CheckoutEntity } from '@checkout/core/domain/entities/checkout.entity';

export class GetCheckoutByOrderIdOutput {
  checkout: CheckoutOutput;

  constructor(entity: CheckoutEntity) {
    this.checkout = new CheckoutOutput(entity);
  }
}