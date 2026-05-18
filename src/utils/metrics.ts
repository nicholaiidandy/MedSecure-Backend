import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

const register = new Registry();

collectDefaultMetrics({ register });

export const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [register],
});

export const mongodbQueryDurationSeconds = new Histogram({
  name: 'mongodb_query_duration_seconds',
  help: 'MongoDB query duration in seconds',
  labelNames: ['model', 'operation', 'status'] as const,
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.3, 0.5, 1, 2],
  registers: [register],
});

export { register };