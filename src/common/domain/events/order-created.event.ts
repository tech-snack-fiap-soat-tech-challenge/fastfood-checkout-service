import { IEvent } from '@nestjs/cqrs';

export class OrderCreatedEvent implements IEvent {
  constructor(
    public readonly orderId: string,
    public readonly customerId: number,
    public readonly amount: number,
  ) {}
}
