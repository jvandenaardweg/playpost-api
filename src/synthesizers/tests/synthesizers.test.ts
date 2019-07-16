import fsExtra from 'fs-extra';
import { Synthesizers } from '../synthesizers';

jest.mock('fs-extra');

describe('Synthesizers', () => {

  test('Class has the right methods and properties', async () => {
    const synthesizier = new Synthesizers([]);

    expect(synthesizier.saveTempFile).toBeTruthy();
    expect(synthesizier.removeAllTempFiles).toBeTruthy();
    expect(synthesizier.removeTempFilePath).toBeTruthy();
    expect(synthesizier.tempFilePaths).toHaveLength(0);
  });

  test('removeAllTempFiles()', async () => {
    const examplePath = 'path/to/something.mp3';
    const synthesizier = new Synthesizers([]);

    synthesizier.tempFilePaths.push(examplePath);
    await synthesizier.removeAllTempFiles();

    expect(synthesizier.tempFilePaths).toHaveLength(0);
    expect(fsExtra.remove).toHaveBeenCalled();

  });

  test('removeTempFilePath()', async () => {
    const examplePath = 'path/to/something.mp3';
    const synthesizier = new Synthesizers([]);

    synthesizier.tempFilePaths.push(examplePath);
    await synthesizier.removeTempFilePath(examplePath);

    expect(synthesizier.tempFilePaths).toHaveLength(0);
    expect(fsExtra.remove).toHaveBeenCalled();

  });

  test('saveTempFile()', async () => {
    const examplePath = 'path/to/something.mp3';
    const synthesizier = new Synthesizers([]);

    await synthesizier.saveTempFile(examplePath, 'asdasdadasdas');

    expect(synthesizier.tempFilePaths).toHaveLength(1);
    expect(fsExtra.ensureFile).toHaveBeenCalled();
    expect(fsExtra.writeFile).toHaveBeenCalled();

  });

  afterAll(() => {
    jest.restoreAllMocks();
  })
})
