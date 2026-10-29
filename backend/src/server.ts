import app from './app';
import { ENV } from './config/env';

const PORT = ENV.PORT;

const server = app.listen(PORT, () => {
  console.log(`CivicSolve Backend Server listening on http://localhost:${PORT}`);
  console.log(`Environment: ${ENV.NODE_ENV}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
