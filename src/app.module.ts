import { ConfigurationModule } from '@app/configuration/configuration.module';
import { Module } from '@nestjs/common';
import { CheckoutModule } from './checkout/checkout.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [ConfigurationModule, CheckoutModule, CommonModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
