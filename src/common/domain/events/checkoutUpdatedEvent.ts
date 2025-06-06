import { IEvent } from '@nestjs/cqrs';
import { Status } from '@checkout/core/application/enums/status.enum';

export class CheckoutUpdatedEvent implements IEvent {
  constructor(
    public readonly orderId: string,
    public readonly checkoutStatus: Status,
  ) {}
}
