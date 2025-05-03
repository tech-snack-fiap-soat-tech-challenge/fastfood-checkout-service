import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration, pinoConfig, typeOrmConfig } from './configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { Logger } from '@common/application/logger';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TypeOrmModule.forRoot(typeOrmConfig()),
    LoggerModule.forRoot({ pinoHttp: pinoConfig() }),
  ],
  providers: [Logger],
  exports: [Logger],
})
export class ConfigurationModule {}
