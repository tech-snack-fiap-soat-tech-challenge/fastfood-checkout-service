import { IEvent } from '@nestjs/cqrs';

export class OrderCreatedEvent implements IEvent {
  constructor(
    public readonly orderId: number,
    public readonly customerId: number,
    public readonly amount: number,
  ) {}
}
