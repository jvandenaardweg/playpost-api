import { EntityRepository, Repository, Between } from 'typeorm';
import { Audiofile } from '../entities/audiofile';
import { startOfMonth, endOfMonth } from 'date-fns';

@EntityRepository(Audiofile)
export class AudiofileRepository extends Repository<Audiofile> {
  /**
   * Method to find the audiofile usage of the current user.
   *
   * So we can determine if the user is above or below his limit for the month.
   *
   * Returns the total usage of the current month in seconds.
   *
   * @param userId
   * @returns totalUsageCurrentMonthInSeconds
   */
  async findAudiofileUsageInCurrentMonth(userId: string): Promise<number> {
    const today = new Date();
    const firstDayOfCurrentMonth = startOfMonth(today);
    const lastDayOfCurrentMonth = endOfMonth(today);

    const userAudiofilesInCurrentMonth = await this.find({
      where: {
        user: {
          id: userId
        },
        createdAt: Between(firstDayOfCurrentMonth, lastDayOfCurrentMonth)
      },
      select: ['length']
    });

    if (!userAudiofilesInCurrentMonth) return 0;

    const totalUsageCurrentMonthInSeconds = userAudiofilesInCurrentMonth.reduce((length, audiofile) => {
      // tslint:disable no-parameter-reassignment
      length = length + audiofile.length;
      return length;
    }, 0);

    return totalUsageCurrentMonthInSeconds;
  }
}
