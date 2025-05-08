import { Body, Controller, Get, HttpStatus, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { UpdateCheckoutStatusRequest } from '@checkout/api/dtos/update-checkout-status-.request';
import { CheckoutOutput } from '@checkout/core/application/dtos/checkout.output';
import { GetCheckoutByOrderIdOutput } from '@checkout/core/application/use-cases/get-checkout-by-order-id/get-checkout-by-order-id.output';
import { GetCheckoutByOrderIdQuery } from '@checkout/core/application/use-cases/get-checkout-by-order-id/get-checkout-by-order-id.query';
import { GetCheckoutsOutput } from '@checkout/core/application/use-cases/get-checkouts/get-checkouts.output';
import { GetCheckoutsQuery } from '@checkout/core/application/use-cases/get-checkouts/get-checkouts.query';
import { UpdateCheckoutStatusCommand } from '@checkout/core/application/use-cases/update-checkout-status/update-checkout-status.command';
import { UpdateCheckoutStatusOutput } from '@checkout/core/application/use-cases/update-checkout-status/update-checkout-status.output';

@ApiTags('checkouts')
@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @ApiOperation({ summary: 'Get all checkouts' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all checkouts.',
    type: [CheckoutOutput],
  })
  @Get()
  async getAllCheckouts(): Promise<CheckoutOutput[]> {
    const output = await this.queryBus.execute<
      GetCheckoutsQuery,
      GetCheckoutsOutput
    >(new GetCheckoutsQuery());

    return output.checkouts;
  }

  @ApiOperation({ summary: 'Webhook for payment gateway confirmation' })
  @ApiBody({ type: UpdateCheckoutStatusRequest })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The checkout status has been updated.',
    type: UpdateCheckoutStatusOutput,
  })
  @Post('/notification')
  async paymentStatusUpdate(
    @Body() input: UpdateCheckoutStatusRequest,
  ): Promise<UpdateCheckoutStatusOutput> {
    const { action, data } = input;
    //TODO: need to implement signature validation from x-signature header

    if (action !== 'payment.updated') {
      return;
    }
    const command = new UpdateCheckoutStatusCommand(data.id);

    return await this.commandBus.execute<
      UpdateCheckoutStatusCommand,
      UpdateCheckoutStatusOutput
    >(command);
  }

  @ApiOperation({ summary: 'Get checkout status by order' })
  @ApiResponse({
    description: 'Return the checkout.',
    type: CheckoutOutput,
    status: HttpStatus.OK,
  })
  @Get(':orderId')
  async getCheckoutByOrder(
    @Param('orderId') orderId: number,
  ): Promise<CheckoutOutput> {
    const input = new GetCheckoutByOrderIdQuery(orderId);

    const output = await this.queryBus.execute<
      GetCheckoutByOrderIdQuery,
      GetCheckoutByOrderIdOutput
    >(input);

    return output.checkout;
  }
}
