import mongoose from 'mongoose';
import { mongodbQueryDurationSeconds } from '../utils/metrics.js';

mongoose.plugin((schema) => {
  schema.pre(/find|count|update|delete|aggregate|insert/i, function () {
    (this as any).__metricsStartNs = process.hrtime.bigint();
  });

  schema.post(/find|count|update|delete|aggregate|insert/i, function () {
    const startNs = (this as any).__metricsStartNs as bigint | undefined;
    if (!startNs) return;

    const durationSeconds = Number(process.hrtime.bigint() - startNs) / 1_000_000_000;
    const operation =
      typeof (this as any).op === 'string'
        ? (this as any).op
        : ((this as any).constructor?.name || 'unknown').toLowerCase();
    const model =
      (this as any).model?.modelName ||
      (this as any)._model?.modelName ||
      (this as any).constructor?.modelName ||
      'unknown';

    mongodbQueryDurationSeconds.labels(model, operation, 'ok').observe(durationSeconds);
  });

  schema.post(/find|count|update|delete|aggregate|insert/i, function (error: any, _res: any, next: (err?: any) => void) {
    const startNs = (this as any).__metricsStartNs as bigint | undefined;
    if (startNs) {
      const durationSeconds = Number(process.hrtime.bigint() - startNs) / 1_000_000_000;
      const operation =
        typeof (this as any).op === 'string'
          ? (this as any).op
          : ((this as any).constructor?.name || 'unknown').toLowerCase();
      const model =
        (this as any).model?.modelName ||
        (this as any)._model?.modelName ||
        (this as any).constructor?.modelName ||
        'unknown';

      mongodbQueryDurationSeconds.labels(model, operation, 'error').observe(durationSeconds);
    }
    next(error);
  });
});

export const connectDatabase = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://db:27017/medsecure');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error:`, error);
    process.exit(1);
  }
};

