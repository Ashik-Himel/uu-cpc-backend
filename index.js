import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { connectDB } from './configs/db.js';
import { clientDomain, port } from './configs/variables.js';
import errorHandler from './middlewares/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
// import contestRoutes from './routes/contestRoutes.js';
// import announcementRoutes from './routes/announcementRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';

const app = express();

app.use(
  cors({
    origin: clientDomain,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
// app.use('/api/contests', contestRoutes);
// app.use('/api/announcements', announcementRoutes);
app.use('/api/feedbacks', feedbackRoutes);

app.use(errorHandler);

connectDB()
  .then(() => {
    app.listen(port, () => console.log(`Server is running on port ${port}`));
  })
  .catch((error) => {
    console.error('Failed to connect to the database', error);
    process.exit(1);
  });

app.get('/', (req, res) => {
  res.status(200).send("Welcome to UU CPC's server!");
});

export default app;
