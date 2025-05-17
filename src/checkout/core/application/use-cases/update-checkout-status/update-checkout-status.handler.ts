import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { ICheckoutRepository } from '@app/checkout/core/domain/interfaces/repositories/checkout.repository.interface';
import { UpdateCheckoutStatusCommand } from './update-checkout-status.command';
import { UpdateCheckoutStatusOutput } from './update-checkout-status.output';
import { UpdateFailedException } from '@app/common/exceptions/entity-update-failed.exception';
import { CheckoutUpdatedEvent } from '@common/domain/events/checkoutUpdatedEvent';
import { IPaymentGateway } from '@checkout/core/domain/interfaces/gateways/payment-gateway.interface';
import { Status } from '@checkout/core/application/enums/status.enum';
import { SqsService } from '@app/common/application/sqs-service';
import { ConfigService } from '@nestjs/config';

@CommandHandler(UpdateCheckoutStatusCommand)
export class UpdateCheckoutStatusHandler
  implements
    ICommandHandler<UpdateCheckoutStatusCommand, UpdateCheckoutStatusOutput>
{
  private readonly queueUrl: string;
  private readonly logger = new Logger(UpdateCheckoutStatusHandler.name);

  constructor(
    @Inject(ICheckoutRepository)
    private readonly checkoutRepository: ICheckoutRepository,
    @Inject(IPaymentGateway)
    private readonly paymentGateway: IPaymentGateway,
    private readonly sqsService: SqsService,
    private readonly configService: ConfigService,
  ) {
    this.queueUrl = this.configService.get<string>(
      'sqs.paymentCompletedQueueUrl',
    );
  }

  async execute(
    command: UpdateCheckoutStatusCommand,
  ): Promise<UpdateCheckoutStatusOutput> {
    const { paymentId } = command;
    const statusMapping = { approved: Status.Paid, rejected: Status.Refused };

    const payment = await this.paymentGateway.getByArgs(paymentId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const checkout = await this.checkoutRepository.getByOrderId(
      payment.orderId,
    );

    if (!checkout) {
      throw new NotFoundException('Checkout not found');
    }

    checkout.changeData({
      ...checkout,
      status: statusMapping[payment.status as keyof typeof statusMapping],
    });

    const updatedCheckout = await this.checkoutRepository.update(
      checkout.id,
      checkout,
    );

    if (!updatedCheckout) {
      throw new UpdateFailedException('Checkout', checkout.id);
    }

    const checkoutEvent = new CheckoutUpdatedEvent(
      checkout.orderId,
      checkout.status as Status,
    );

    this.logger.log(
      `sending checkout event to SQS: ${JSON.stringify(checkoutEvent)}, QueueUrl: ${this.queueUrl}`,
    );
    await this.sqsService.sendMessage(
      this.queueUrl,
      `checkout-${checkoutEvent.orderId}`,
      JSON.stringify(checkoutEvent),
    );

    return new UpdateCheckoutStatusOutput(updatedCheckout);
  }
}
