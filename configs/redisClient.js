import { createClient } from 'redis';
import { redisURL } from './variables.js';

const redisClient = createClient({
  url: redisURL,
});

redisClient.on('error', (err) => console.error('Redis Error:', err));

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Connected to Redis');
  } catch (err) {
    console.error('Redis connection error:', err);
  }
};
connectRedis();

export default redisClient;
