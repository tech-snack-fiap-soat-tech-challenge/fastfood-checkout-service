import { ConfigurationModule } from '@app/configuration/configuration.module';
import { Module } from '@nestjs/common';
import { Logger } from '@common/application/logger';
import { CheckoutModule } from './checkout/checkout.module';

@Module({
  imports: [ConfigurationModule, CheckoutModule],
  controllers: [],
  providers: [Logger],
})
export class AppModule {}
