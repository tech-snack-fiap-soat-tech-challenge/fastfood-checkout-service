import { ApiProperty } from '@nestjs/swagger';
import { CheckoutEntity } from '../../domain/entities/checkout.entity';

export class CheckoutOutput {
  @ApiProperty({
    description: 'Unique identifier of the checkout',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Unique identifier for the payment',
    example: 'pay_12345',
  })
  paymentId: string;

  @ApiProperty({
    description: 'Code associated with the payment',
    example: 'PCODE1234',
  })
  paymentCode: string;

  @ApiProperty({
    description: 'Current status of the checkout',
    example: 'paid',
  })
  status: string;

  @ApiProperty({
    description: 'Identifier of the related order',
    example: 101,
  })
  orderId: number;

  @ApiProperty({
    description: 'Date when the checkout was created',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date when the checkout was last updated',
    example: '2024-01-02T00:00:00Z',
  })
  updatedAt: Date;

  constructor(entity: CheckoutEntity) {
    this.id = entity.id;
    this.paymentId = entity.paymentId;
    this.paymentCode = entity.paymentCode;
    this.status = entity.status;
    this.orderId = entity.orderId;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
  }
}
