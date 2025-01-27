import { MongoClient, ServerApiVersion } from 'mongodb';
import { mongoUri } from './variables.js';

const client = new MongoClient(mongoUri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

export async function connectDB() {
  try {
    await client.connect();
    console.log('Database connected successfully!');
    return client.db('uu-cpc');
  } catch (error) {
    console.error('Error connecting to the database', error);
    throw error;
  }
}

export function getDB() {
  return client.db('uu-cpc');
}
