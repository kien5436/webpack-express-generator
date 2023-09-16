import { config } from 'dotenv';

config();

export const NODE_ENV = process.env.NODE_ENV;
export const PORT = process.env.PORT;