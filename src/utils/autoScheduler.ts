import { CronJob } from 'cron';
import { logger } from './logger';

type TaskFunction = () => Promise<void>;
type ScheduleConfig = string | { cronTime: string; timeZone?: string };

export class AutoScheduler {
  private job: CronJob | null = null;

  constructor(
    private task: TaskFunction,
    private config: ScheduleConfig,
    private taskName: string
  ) {
    this.initialize();
  }

  private initialize() {
    const cronConfig = typeof this.config === 'string' 
      ? { cronTime: this.config, timeZone: 'UTC' }
      : this.config;

    // Properly initialize CronJob with separate arguments
    this.job = new CronJob(
      cronConfig.cronTime,
      this.executeTask.bind(this),
      null, // onComplete callback
      true, // start immediately
      cronConfig.timeZone || 'UTC'
    );

    logger.info(`Scheduled task "${this.taskName}" with pattern: ${cronConfig.cronTime}`);
  }

  private async executeTask() {
    try {
      logger.info(`Starting task: ${this.taskName}`);
      await this.task();
      logger.info(`Completed task: ${this.taskName}`);
    } catch (error) {
      logger.error(`Task "${this.taskName}" failed:`, error);
    }
  }

  public stop() {
    this.job?.stop();
    logger.info(`Stopped task: ${this.taskName}`);
  }

  public restart() {
    this.stop();
    this.initialize();
  }
}