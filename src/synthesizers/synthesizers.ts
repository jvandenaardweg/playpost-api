import fsExtra from 'fs-extra';

export class Synthesizers {
  public tempFilePaths: string[];

  constructor(tempFilePaths: string[]) {
    this.tempFilePaths = tempFilePaths;
  }

  public saveTempFile = async (tempLocalAudiofilePath: string, response: any): Promise<string> => {
    await fsExtra.ensureFile(tempLocalAudiofilePath);
    await fsExtra.writeFile(tempLocalAudiofilePath, response, 'binary');

    this.tempFilePaths.push(tempLocalAudiofilePath);

    return tempLocalAudiofilePath;
  }

  public removeTempFilePath = async (tempLocalAudiofilePath: string): Promise<string> => {
    await fsExtra.remove(tempLocalAudiofilePath);

    this.tempFilePaths = this.tempFilePaths.filter((tempFilePath) => tempFilePath !== tempLocalAudiofilePath);

    return tempLocalAudiofilePath;
  }

  public removeAllTempFiles = async (): Promise<string[]> => {
    for (const tempFilePath of this.tempFilePaths) {
      await fsExtra.remove(tempFilePath);
    }

    this.tempFilePaths = [];

    return this.tempFilePaths;
  }
}
