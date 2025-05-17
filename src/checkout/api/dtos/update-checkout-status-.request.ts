import { IsNumber, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCheckoutStatusRequest {
  @ApiProperty({
    name: 'id',
    example: 'pay_12345',
    description: 'Payment id',
    required: true,
  })
  @IsString()
  id: string;

  @ApiProperty({
    name: 'action',
    example: 'payment.created',
    description: 'Action of the event',
    required: true,
  })
  @IsString()
  action: string;

  @ApiProperty({
    name: 'data',
    example: { id: 12345 },
    description: 'The checkout payment_id',
    required: true,
  })
  @IsObject()
  data: {
    id: string;
  };
}
