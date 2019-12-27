import nodeFetch from 'node-fetch';
import { EVoiceGender } from '../database/entities/voice';
import { BaseService } from './index';

export type SynthesizerName = 'google' | 'aws';
export type SynthesizeAction = 'upload' | 'preview';
export type SynthesizeOutputFormat = 'mp3' | 'wav';

interface RequestBody {
  voiceName: string;
  outputFormat: SynthesizeOutputFormat;
  voiceLanguageCode: string;
  voiceSsmlGender: EVoiceGender;
  ssml: string;
  bucketName?: string; // only with action: upload
  bucketUploadDestination?: string; // only with action: upload
}

interface UploadOptions {
  voiceName: string;
  outputFormat: SynthesizeOutputFormat;
  voiceLanguageCode: string;
  voiceSsmlGender: EVoiceGender;
  ssml: string;
  bucketName: string; // only with action: upload
  bucketUploadDestination: string; // only with action: upload
}

interface PreviewOptions {
  voiceName: string;
  outputFormat: SynthesizeOutputFormat;
  voiceSsmlGender: EVoiceGender;
  voiceLanguageCode: string;
  ssml: string;
}

interface SynthesizeUploadResponse {
  fileMetaData: any;
  publicFileUrl: string;
  durationInSeconds: number;
}

interface SynthesizePreviewResponse {
  audio: string; // base64 string, which can be used in web players
}

export class SynthesizerService extends BaseService {
  private readonly synthesizerName: SynthesizerName;

  constructor(synthesizerName: SynthesizerName) {
    super()

    this.synthesizerName = synthesizerName;
  }

  /**
   * Sends a preview request to the synthesizer.
   * This preview request can have a maximum of 5000 characters for Google Cloud and 3000 characters for AWS Polly.
   *
   * Returns: base64 encoded audio string
   */
  public preview = async (options: PreviewOptions): Promise<string> => {
    const response: SynthesizePreviewResponse = await this.synthesize(
      'preview',
      options
    );

    return response.audio;
  }

  /**
   * Sends a upload request to the synthesizer.
   *
   * Synthesizer will synthesize the given `ssml` with the given voice, and will store the output in the
   * given `bucketName` and `bucketUploadDestination`.
   */
  public upload = async (options: UploadOptions): Promise<SynthesizeUploadResponse> => {
    const response: SynthesizeUploadResponse = await this.synthesize(
      'upload',
      {
        ...options,
        bucketName: `${process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME}`
      }
    );

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
  private synthesize = async (action: SynthesizeAction, payload: RequestBody) => {
    const payloadStringified = JSON.stringify(payload);

    const response = await nodeFetch(`https://playpost-synthesizer-ue5zwn5yja-ew.a.run.app/v1/${this.synthesizerName}/${action}`, {
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
