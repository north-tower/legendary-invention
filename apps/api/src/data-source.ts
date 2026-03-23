import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: true,
  entities: ['apps/api/src/**/*.entity.ts'],
  migrations: ['apps/api/src/migrations/*.ts'],
  subscribers: [],
});
