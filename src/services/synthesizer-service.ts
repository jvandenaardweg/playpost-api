import nodeFetch from 'node-fetch';
import { BaseService } from './index';

interface RequestBody {
  action: 'upload' | 'preview',
  synthesizerName: 'google' | 'aws',
  voiceSsmlGender: 'FEMALE' | 'MALE',
  voiceName: string;
  voiceLanguageCode: string;
  ssml: string;
  bucketName?: 'storage.playpost.app' | 'storage-development.playpost.app' | 'storage-staging.playpost.app'; // only with action: upload
  bucketUploadDestination?: string; // only with action: upload
}

interface SynthesizeUploadResponse {
  fileMetaData: any;
  publicFileUrl: string;
  durationInSeconds: number;
  audiofileMetadata: any;
}

interface SynthesizePreviewResponse {
  audio: string; // base64 string, which can be used in web players
}

export class SynthesizerService extends BaseService {
  constructor() {
    super()
  }

  /**
   * Sends a preview request to the synthesizer.
   * This preview request can have a maximum of 5000 characters for Google Cloud and 3000 characters for AWS Polly.
   *
   * Returns: base64 encoded audio string
   */
  public preview = async (payload: RequestBody): Promise<string> => {
    const response: SynthesizePreviewResponse = await this.synthesize({
      ...payload,
      action: 'preview'
    });

    return response.audio;
  }

  /**
   * Sends a upload request to the synthesizer.
   *
   * Synthesizer will synthesize the given `ssml` with the given voice, and will store the output in the
   * given `bucketName` and `bucketUploadDestination`.
   */
  public upload = async (payload: RequestBody): Promise<SynthesizeUploadResponse> => {
    const response: SynthesizeUploadResponse = await this.synthesize({
      ...payload,
      action: 'upload'
    });

    return response;
  }

  /**
   * Does a request to our Google Cloud Function.
   *
   * Function will return an uploaded audiofile URL
   *
   * Or
   *
   * Function will return a audio base64 string
   */
  private synthesize = async (payload: RequestBody) => {
    const payloadStringified = JSON.stringify(payload);

    const response = await nodeFetch('https://europe-west1-playpost.cloudfunctions.net/synthesize', {
      method: 'POST',
      body: payloadStringified,
      headers: {
        'Authorization': `Bearer ${process.env.SYNTHESIZER_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const json = await response.json();

    return json;
  }
}
