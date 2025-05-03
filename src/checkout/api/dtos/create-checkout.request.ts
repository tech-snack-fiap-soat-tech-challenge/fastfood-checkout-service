import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCheckoutRequest {
  @ApiProperty({
    name: 'paymentId',
    example: '123abc',
    description: 'Payment platform checkout id',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentId: string;

  @ApiProperty({
    name: 'paymentCode',
    example: '123abc',
    description: 'Payment code',
    required: false,
  })
  @IsString()
  paymentCode: string;

  @ApiProperty({
    name: 'orderId',
    example: 1,
    description: 'The id of the order',
    required: true,
  })
  @IsNumber()
  orderId: number;
}
