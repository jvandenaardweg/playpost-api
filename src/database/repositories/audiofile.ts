import { endOfMonth, startOfMonth } from 'date-fns';
import { Between, EntityRepository, Repository } from 'typeorm';
import { Audiofile } from '../entities/audiofile';
import { EVoiceQuality } from '../entities/voice';

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

    if (!userAudiofilesInCurrentMonth) { return 0; }

    const totalUsageCurrentMonthInSeconds = userAudiofilesInCurrentMonth.reduce((length, audiofile) => {
      // tslint:disable no-parameter-reassignment
      length = length + audiofile.length;
      return length;
    }, 0);

    return totalUsageCurrentMonthInSeconds;
  }

  /**
   * Returns the total usage in seconds the user used our highest quality voices.
   *
   * @param userId
   */
  async findHighQualityAudiofileUsageInSeconds(userId: string): Promise<number> {
    const audiofilesVeryHighQuality = await this
    .createQueryBuilder('audiofile')
      .leftJoinAndSelect('audiofile.voice', 'voice')
        .where('audiofile.user = :userId', { userId })
        .andWhere('voice.quality = :quality', { quality: EVoiceQuality.VERY_HIGH })
    .getMany();

    if (!audiofilesVeryHighQuality.length) { return 0; }

    const totalUsageCurrentMonthInSeconds = audiofilesVeryHighQuality.reduce((length, audiofile) => {
      // tslint:disable no-parameter-reassignment
      length = length + audiofile.length;
      return length;
    }, 0);

    return totalUsageCurrentMonthInSeconds;
  }
}
