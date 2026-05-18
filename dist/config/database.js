import mongoose from 'mongoose';
import { mongodbQueryDurationSeconds } from '../utils/metrics.js';
mongoose.plugin((schema) => {
    schema.pre(/find|count|update|delete|aggregate|insert/i, function () {
        this.__metricsStartNs = process.hrtime.bigint();
    });
    schema.post(/find|count|update|delete|aggregate|insert/i, function () {
        const startNs = this.__metricsStartNs;
        if (!startNs)
            return;
        const durationSeconds = Number(process.hrtime.bigint() - startNs) / 1_000_000_000;
        const operation = typeof this.op === 'string'
            ? this.op
            : (this.constructor?.name || 'unknown').toLowerCase();
        const model = this.model?.modelName ||
            this._model?.modelName ||
            this.constructor?.modelName ||
            'unknown';
        mongodbQueryDurationSeconds.labels(model, operation, 'ok').observe(durationSeconds);
    });
    schema.post(/find|count|update|delete|aggregate|insert/i, function (error, _res, next) {
        const startNs = this.__metricsStartNs;
        if (startNs) {
            const durationSeconds = Number(process.hrtime.bigint() - startNs) / 1_000_000_000;
            const operation = typeof this.op === 'string'
                ? this.op
                : (this.constructor?.name || 'unknown').toLowerCase();
            const model = this.model?.modelName ||
                this._model?.modelName ||
                this.constructor?.modelName ||
                'unknown';
            mongodbQueryDurationSeconds.labels(model, operation, 'error').observe(durationSeconds);
        }
        next(error);
    });
});
export const connectDatabase = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://db:27017/medsecure');
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    }
    catch (error) {
        console.error(`❌ MongoDB Connection Error:`, error);
        process.exit(1);
    }
};
