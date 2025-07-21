const cluster = require('cluster');
const os = require('os');
const logger = require('../utils/logger');

class LoadBalancer {
  constructor() {
    this.workerCount = process.env.WORKER_COUNT || os.cpus().length;
    this.workers = new Map();
    this.isShuttingDown = false;
  }

  start() {
    if (cluster.isMaster) {
      logger.info(`🔧 Master process ${process.pid} is setting up ${this.workerCount} workers`);

      // Fork workers
      for (let i = 0; i < this.workerCount; i++) {
        this.forkWorker();
      }

      // Handle worker events
      cluster.on('exit', (worker, code, signal) => {
        if (!this.isShuttingDown) {
          logger.error(`⚠️ Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
          logger.info('🔄 Starting a new worker...');
          this.forkWorker();
        }
      });

      cluster.on('online', (worker) => {
        logger.info(`✅ Worker ${worker.process.pid} is online`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.gracefulShutdown());
      process.on('SIGINT', () => this.gracefulShutdown());

      return true; // Master process
    } else {
      return false; // Worker process - should start the app
    }
  }

  forkWorker() {
    const worker = cluster.fork();
    this.workers.set(worker.id, worker);

    worker.on('message', (message) => {
      if (message.type === 'health') {
        logger.debug(`💓 Health check from worker ${worker.process.pid}: ${message.status}`);
      }
    });
  }

  gracefulShutdown() {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;
    logger.info('🔄 Master initiating graceful shutdown...');

    // Disconnect all workers
    for (const worker of this.workers.values()) {
      worker.disconnect();
    }

    // Give workers 10 seconds to finish
    setTimeout(() => {
      for (const worker of this.workers.values()) {
        if (!worker.isDead()) {
          logger.warn(`⚠️ Force killing worker ${worker.process.pid}`);
          worker.kill();
        }
      }
      process.exit(0);
    }, 10000);
  }

  // Health check for workers
  sendHealthCheck() {
    if (cluster.isWorker) {
      process.send({
        type: 'health',
        status: 'healthy',
        pid: process.pid,
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get cluster statistics
  getStats() {
    if (cluster.isMaster) {
      const workers = Object.values(cluster.workers);
      return {
        master_pid: process.pid,
        worker_count: workers.length,
        workers: workers.map(w => ({
          id: w.id,
          pid: w.process.pid,
          state: w.state,
          isDead: w.isDead()
        }))
      };
    }
    return {
      worker_pid: process.pid,
      worker_id: cluster.worker.id
    };
  }
}

module.exports = new LoadBalancer();
