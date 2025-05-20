import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export interface AppConfig {
  app: {
    env: string;
    port: number;
    logLevel: string;
  };
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    useSSL: boolean;
  };
  sqs: {
    region: string;
    endpoint: string;
    orderCreatedQueueUrl: string;
    paymentCompletedQueueUrl: string;
  };
}

export const configuration = (): AppConfig => ({
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    logLevel: process.env.LOG_LEVEL || 'debug',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'fastfood',
    useSSL: process.env.DB_SSL === 'true',
  },
  sqs: {
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint:
      process.env.SQS_ENDPOINT ||
      (process.env.NODE_ENV === 'development'
        ? 'http://localhost:9324'
        : 'https://sqs.us-east-1.amazonaws.com'),
    orderCreatedQueueUrl:
      process.env.AWS_ORDER_CREATED_QUEUE_URL ||
      'http://localhost:9324/000000000000/order-created.fifo',
    paymentCompletedQueueUrl:
      process.env.AWS_PAYMENT_COMPLETED_QUEUE_URL ||
      'http://localhost:9324/000000000000/payment-completed.fifo',
  },
});

export const typeOrmConfig = (): PostgresConnectionOptions => {
  const appConfig = configuration();
  const databaseConfig = appConfig.database;

  const config: PostgresConnectionOptions = {
    type: 'postgres',
    host: databaseConfig.host,
    port: databaseConfig.port,
    username: databaseConfig.username,
    password: databaseConfig.password,
    database: databaseConfig.database,
    entities: [__dirname + '/../**/*.entity.{js, ts}'],
    ssl: databaseConfig.useSSL && {
      rejectUnauthorized: true,
      ca: process.env.DB_SSL_CERT,
    },
    logging: appConfig.app.env === 'development',
  };
  return config;
};

export const pinoConfig = () => {
  const config = configuration();
  const pinoOptions = {
    level: config.app.logLevel,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        singleLine: true,
        ignore: 'pid,hostname',
      },
    },
    singleLine: true,
    redact: ['req.headers.authorization'],
    formatters: {
      level: (label: string) => {
        return { level: label };
      },
    },
  };

  return pinoOptions;
};
