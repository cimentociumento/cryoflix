import { Router } from 'express';
import { authRoutes } from '../modules/auth/presentation/routes/authRoutes';
import { userRoutes } from '../modules/user/presentation/routes/userRoutes';
import { contentRoutes } from '../modules/content/presentation/routes/contentRoutes';
import { uploadRoutes } from '../modules/upload/presentation/routes/uploadRoutes';
import { transcodingRoutes } from '../modules/transcoding/presentation/routes/transcodingRoutes';
import { streamingRoutes } from '../modules/streaming/presentation/routes/streamingRoutes';
import { paymentRoutes } from '../modules/payment/presentation/routes/paymentRoutes';
import { recommendationRoutes } from '../modules/recommendation/presentation/routes/recommendationRoutes';
import { analyticsRoutes } from '../modules/analytics/presentation/routes/analyticsRoutes';
import { notificationRoutes } from '../modules/notification/presentation/routes/notificationRoutes';
import { movieRoutes } from '../modules/metadata/presentation/routes/movieRoutes';
import { playerRoutes } from '../modules/player/presentation/routes/playerRoutes';
import { subtitleRoutes } from '../modules/subtitle/presentation/routes/subtitleRoutes';

export const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/content', contentRoutes);
apiRouter.use('/upload', uploadRoutes);
apiRouter.use('/transcoding', transcodingRoutes);
apiRouter.use('/streaming', streamingRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/recommendations', recommendationRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/metadata', movieRoutes);
apiRouter.use('/player', playerRoutes);
apiRouter.use('/subtitles', subtitleRoutes);

