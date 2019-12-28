import * as GoogleCloudStorage from '../google-cloud';

import articleMock from '../../../tests/__mocks/article';
import voiceMock from '../../../tests/__mocks/voice';
import { AudiofileMimeType } from '../../database/entities/audiofile';

jest.mock('@google-cloud/storage');

describe('Storage: Google Cloud', () => {
  const examplePath = 'path/test.mp3';
  const fileMock = {
    metadata: {
      name: examplePath
    }
  }

  describe('getPublicFileUrlFromFileMetaData()', () => {

    test('Should return the public url of a file', async () => {
      const publicFileUrl = GoogleCloudStorage.getPublicFileUrlFromFileMetaData(fileMock as any);

      expect(publicFileUrl.includes('https://')).toBeTruthy();
      expect(publicFileUrl.includes(examplePath)).toBeTruthy();
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

  })

  describe('getPublicFileUrl()', () => {

    test('Should return the public url of a file', async () => {
      const uploadResponseMock = [fileMock];

      const publicFileUrl = GoogleCloudStorage.getPublicFileUrl(uploadResponseMock as any);

      expect(publicFileUrl.includes('https://')).toBeTruthy();
      expect(publicFileUrl.includes(examplePath)).toBeTruthy();
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

  })

  describe('deleteAudiofile()', () => {

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('Should delete a file when theres a file', async () => {

      const spyGetFiles = jest.spyOn(GoogleCloudStorage, 'getFiles').mockResolvedValue([{ name: 'file.mp3'}] as any);
      const spyDeleteFile = jest.spyOn(GoogleCloudStorage, 'deleteFile').mockResolvedValue([] as any);

      await GoogleCloudStorage.deleteAudiofile('article-id', 'audiofile-id');

      expect(spyGetFiles).toBeCalledTimes(1);
      expect(spyDeleteFile).toBeCalledTimes(1);
    })

    it('Should error when no result is returned from getFiles', async () => {
      const spyGetFiles = jest.spyOn(GoogleCloudStorage, 'getFiles').mockResolvedValue([] as any);

      try {
        await GoogleCloudStorage.deleteAudiofile('article-id', 'audiofile-id');
      } catch (err) {
        expect(err).toBeTruthy();
        expect(spyGetFiles).toBeCalledTimes(1);
      }
    })

    it('Should error when no articleId or audiofileId is given', async () => {
      const spyGetFiles = jest.spyOn(GoogleCloudStorage, 'getFiles').mockResolvedValue([] as any);
      const spyDeleteFile = jest.spyOn(GoogleCloudStorage, 'deleteFile').mockResolvedValue([] as any);

      try {
        await GoogleCloudStorage.deleteAudiofile('article-id', '');
      } catch (err) {
        expect(err).toBeTruthy();
        expect(spyGetFiles).toBeCalledTimes(0);
        expect(spyDeleteFile).toBeCalledTimes(0);
      }

      try {
        await GoogleCloudStorage.deleteAudiofile('', 'audiofile-id');
      } catch (err) {
        expect(err).toBeTruthy();
        expect(spyGetFiles).toBeCalledTimes(0);
        expect(spyDeleteFile).toBeCalledTimes(0);
      }

      try {
        await GoogleCloudStorage.deleteAudiofile('', '');
      } catch (err) {
        expect(err).toBeTruthy();
        expect(spyGetFiles).toBeCalledTimes(0);
        expect(spyDeleteFile).toBeCalledTimes(0);
      }
    })

  })

  describe('deleteVoicePreview()', () => {

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('Should delete a file when theres a file', async () => {

      const spyGetFiles = jest.spyOn(GoogleCloudStorage, 'getFiles').mockResolvedValue([{ name: 'file.mp3'}] as any);
      const spyDeleteFile = jest.spyOn(GoogleCloudStorage, 'deleteFile').mockResolvedValue([] as any);

      await GoogleCloudStorage.deleteVoicePreview('voice-id');

      expect(spyGetFiles).toBeCalledTimes(1);
      expect(spyDeleteFile).toBeCalledTimes(1);
    })

    it('Should error when no result is returned from getFiles', async () => {
      const spyGetFiles = jest.spyOn(GoogleCloudStorage, 'getFiles').mockResolvedValue([] as any);

      try {
        await GoogleCloudStorage.deleteVoicePreview('voice-id');
      } catch (err) {
        expect(err).toBeTruthy();
        expect(spyGetFiles).toBeCalledTimes(1);
      }
    })

    it('Should error when no articleId or audiofileId is given', async () => {
      const spyGetFiles = jest.spyOn(GoogleCloudStorage, 'getFiles').mockResolvedValue([] as any);
      const spyDeleteFile = jest.spyOn(GoogleCloudStorage, 'deleteFile').mockResolvedValue([] as any);

      try {
        await GoogleCloudStorage.deleteVoicePreview('');
      } catch (err) {
        expect(err).toBeTruthy();
        expect(spyGetFiles).toBeCalledTimes(0);
        expect(spyDeleteFile).toBeCalledTimes(0);
      }

    })

  })

  describe('uploadArticleAudioFile()', () => {

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('Should upload an articles audiofile', async () => {
      const uploadResponseMock = [
        {
          metadata: {
            name: 'test'
          }
        }
      ]

      const spyUpload = jest.spyOn(GoogleCloudStorage, 'upload').mockResolvedValue(uploadResponseMock as any);

      await GoogleCloudStorage.uploadArticleAudioFile(
        voiceMock as any,
        'test/path.mp3',
        'upload/path/test/path.mp3',
        AudiofileMimeType.MP3,
        articleMock as any,
        '9b9c9738-d4b2-447f-b455-193cd4280dad',
        100
      );

      expect(spyUpload).toBeCalledTimes(1);
    })

    it('Should throw an error when upload fails', async () => {
      const errorMessage = 'Some error';
      const spyUpload = jest.spyOn(GoogleCloudStorage, 'upload').mockRejectedValue(new Error(errorMessage));

      try {
        await GoogleCloudStorage.uploadArticleAudioFile(
          voiceMock as any,
          'test/path.mp3',
          'upload/path/test/path.mp3',
          AudiofileMimeType.MP3,
          articleMock as any,
          '9b9c9738-d4b2-447f-b455-193cd4280dad',
          100
          );
      } catch (err) {
        expect(spyUpload).toBeCalledTimes(1);
        expect(err).toBeTruthy();
        expect(err.message).toBe(errorMessage);
      }
    })

  })

  describe('uploadVoicePreviewAudiofile()', () => {

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('Should upload an voice preview audiofile', async () => {
      const uploadResponseMock = [
        {
          metadata: {
            name: 'test'
          }
        }
      ]

      const spyUpload = jest.spyOn(GoogleCloudStorage, 'upload').mockResolvedValue(uploadResponseMock as any);

      await GoogleCloudStorage.uploadVoicePreviewAudiofile(
        voiceMock as any,
        'test/path.mp3',
        AudiofileMimeType.MP3
      );

      expect(spyUpload).toBeCalledTimes(1);
    })

    it('Should throw an error when upload fails', async () => {
      const errorMessage = 'Some error';
      const spyUpload = jest.spyOn(GoogleCloudStorage, 'upload').mockRejectedValue(new Error(errorMessage));

      try {
        await GoogleCloudStorage.uploadVoicePreviewAudiofile(
          voiceMock as any,
          'test/path.mp3',
          AudiofileMimeType.MP3
        );
      } catch (err) {
        expect(spyUpload).toBeCalledTimes(1);
        expect(err).toBeTruthy();
        expect(err.message).toBe(errorMessage);
      }
    })

  })

  describe('deleteAllArticleAudiofiles()', () => {

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('Should delete all audiofiles of an article', async () => {

      const spyGetFiles = jest.spyOn(GoogleCloudStorage, 'getFiles').mockResolvedValue([{ name: 'file-one.mp3' }, { name: 'file-two.mp3'}] as any);
      const spyDeleteFile = jest.spyOn(GoogleCloudStorage, 'deleteFile').mockResolvedValue([] as any);

      await GoogleCloudStorage.deleteAllArticleAudiofiles('article-id');

      expect(spyGetFiles).toBeCalledTimes(1);
      expect(spyDeleteFile).toBeCalledTimes(2);
    })

    it('Should error when no result is returned from getFiles', async () => {
      const spyGetFiles = jest.spyOn(GoogleCloudStorage, 'getFiles').mockResolvedValue([] as any);

      try {
        await GoogleCloudStorage.deleteAllArticleAudiofiles('article-id');
      } catch (err) {
        expect(err).toBeTruthy();
        expect(spyGetFiles).toBeCalledTimes(1);
      }
    })

    it('Should error when deleteFile returns an error', async () => {
      const errorMessage = 'Some error';
      const spyGetFiles = jest.spyOn(GoogleCloudStorage, 'getFiles').mockResolvedValue([{ name: 'file-one.mp3' }, { name: 'file-two.mp3'}] as any);
      const spyDeleteFile = jest.spyOn(GoogleCloudStorage, 'deleteFile').mockRejectedValue(new Error(errorMessage));

      try {
        await GoogleCloudStorage.deleteAllArticleAudiofiles('article-id');
      } catch (err) {
        expect(err).toBeTruthy();
        expect(err.message).toBe(errorMessage);
        expect(spyGetFiles).toBeCalledTimes(1);
        expect(spyDeleteFile).toBeCalledTimes(2);
      }
    })

    it('Should error when no articleId', async () => {
      const spyGetFiles = jest.spyOn(GoogleCloudStorage, 'getFiles').mockResolvedValue([] as any);
      const spyDeleteFile = jest.spyOn(GoogleCloudStorage, 'deleteFile').mockResolvedValue([] as any);

      try {
        await GoogleCloudStorage.deleteAllArticleAudiofiles('');
      } catch (err) {
        expect(err).toBeTruthy();
        expect(spyGetFiles).toBeCalledTimes(0);
        expect(spyDeleteFile).toBeCalledTimes(0);
      }

    })

  })

})
