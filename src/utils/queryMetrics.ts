import mongoose from 'mongoose';
import { mongodbQueryDurationSeconds } from './metrics.js';

/**
 * Setup Mongoose hooks to record query metrics
 * This tracks duration and success/failure of all MongoDB operations
 */
export const setupMongooseMetrics = () => {
  // Track query execution time
  mongoose.connection.on('open', () => {
    console.log('Setting up Mongoose query metrics...');

    // Hook into all queries
    const hookModels = (schema: mongoose.Schema) => {
      // Pre-hook to capture start time
      schema.pre(/.*/, function (this: any, next: Function) {
        this._startTime = Date.now();
        next();
      });

      // Post-hook to record metrics
      schema.post(/.*/, function (this: any) {
        if (this._startTime) {
          const duration = (Date.now() - this._startTime) / 1000; // Convert to seconds
          const operation = this.constructor.name || 'Unknown';

          mongodbQueryDurationSeconds.observe(
            {
              model: this.collection?.name || 'unknown',
              operation: operation,
              status: 'success',
            },
            duration
          );
        }
      });

      // Error hook to record failed queries
      schema.post(/.*/, function (this: any, error: any, doc: any, next: Function) {
        if (error && this._startTime) {
          const duration = (Date.now() - this._startTime) / 1000;
          const operation = this.constructor.name || 'Unknown';

          mongodbQueryDurationSeconds.observe(
            {
              model: this.collection?.name || 'unknown',
              operation: operation,
              status: 'error',
            },
            duration
          );
        }
        next(error);
      });
    };

    // Apply hooks to all models
    Object.values(mongoose.modelNames()).forEach((modelName) => {
      const model = mongoose.model(modelName);
      if (model.schema) {
        hookModels(model.schema);
      }
    });
  });

  // Alternative: Direct timing wrapper for specific operations
  return {
    recordQueryTime: (operation: string, modelName: string, duration: number, status: 'success' | 'error' = 'success') => {
      mongodbQueryDurationSeconds.observe(
        {
          model: modelName,
          operation: operation,
          status: status,
        },
        duration
      );
    },
  };
};

/**
 * Wrapper function to measure and record query execution time
 */
export async function withMetrics<T>(
  query: Promise<T>,
  modelName: string,
  operation: string
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await query;
    const duration = (Date.now() - startTime) / 1000;

    mongodbQueryDurationSeconds.observe(
      {
        model: modelName,
        operation: operation,
        status: 'success',
      },
      duration
    );

    return result;
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;

    mongodbQueryDurationSeconds.observe(
      {
        model: modelName,
        operation: operation,
        status: 'error',
      },
      duration
    );

    throw error;
  }
}
