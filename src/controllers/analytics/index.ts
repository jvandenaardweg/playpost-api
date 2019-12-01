
import { Request, Response } from 'express';
import { logger } from '../../utils';
import { AnalyticsEventRequestBody } from './types';

export class AnalyticsController {
  createEvent = async (req: Request, res: Response) => {
    const eventData = req.body as AnalyticsEventRequestBody

    logger.info('Store in BigQuery:', eventData);
  }

  getEvents = async (req: Request, res: Response) => {
    // params:
    // dateStart
    // dateEnd
    // event
    // articleId (optional)
    // groupedBy (hour, day, week, month, year)

    // fixed (server side only):
    // publisherId

    // For example:
    // - get all plays from all articles from a publisher within 2019-01-01 till 2019-11-29
    // - get all plays from a specific article from a publisher within 2019-01-01 till 2019-11-29
    logger.info('Get from BigQuery:', req.query);

  }
}
