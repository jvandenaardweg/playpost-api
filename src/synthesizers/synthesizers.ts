import fsExtra from 'fs-extra';
import { concatAudioFiles } from '../utils/audio';

export class Synthesizers {
  tempFilePaths: string[];

  constructor(tempFilePaths: string[]) {
    this.tempFilePaths = tempFilePaths;
  }

  saveTempFile = async (tempLocalAudiofilePath: string, response: any): Promise<string> => {
    await fsExtra.ensureFile(tempLocalAudiofilePath);
    await fsExtra.writeFile(tempLocalAudiofilePath, response, 'binary');

    // Save it in tempFilePaths, so we can remove it later
    this.tempFilePaths.push(tempLocalAudiofilePath);

    return tempLocalAudiofilePath;
  }

  removeTempFilePath = async (tempLocalAudiofilePath: string): Promise<string[]> => {
    await fsExtra.remove(tempLocalAudiofilePath);

    this.tempFilePaths = this.tempFilePaths.filter((tempFilePath) => tempFilePath !== tempLocalAudiofilePath);

    return this.tempFilePaths;
  }

  removeAllTempFiles = async (): Promise<string[]> => {
    const promises: Array<Promise<void>> = [];

    for (const tempFilePath of this.tempFilePaths) {
      promises.push(fsExtra.remove(tempFilePath))
    }

    await Promise.all(promises);

    this.tempFilePaths = [];

    return this.tempFilePaths;
  }

  concatinateAudioFiles = async (localAudiofilePaths: string[], storageUploadPath: string, encodingParameter: string) => {
    const concatinatedLocalAudiofilePath = await concatAudioFiles(
      localAudiofilePaths,
      storageUploadPath,
      encodingParameter
    );

    // Save it in tempFilePaths, so we can remove it later
    this.tempFilePaths.push(concatinatedLocalAudiofilePath);

    return concatinatedLocalAudiofilePath;
  }

}
