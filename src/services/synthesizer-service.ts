// tslint:disable-next-line: no-submodule-imports
import { google } from '@google-cloud/text-to-speech/build/protos/protos';
import { Polly } from 'aws-sdk';
import nodeFetch from 'node-fetch';
import { getRepository, Repository } from 'typeorm';
import * as uuid from 'uuid';

import { Audiofile, AudiofileMimeType } from '../database/entities/audiofile';
import { EVoiceGender, EVoiceSynthesizer } from '../database/entities/voice';
import { BaseService } from './index';

type IGoogleAudioEncoding = google.cloud.texttospeech.v1.AudioEncoding
type IGoogleVoice = google.cloud.texttospeech.v1.Voice
type SynthesizeSpeechRequest = google.cloud.texttospeech.v1.SynthesizeSpeechRequest

export type GoogleAudioEncoding = IGoogleAudioEncoding;

export type GoogleVoice = IGoogleVoice;

export type GoogleSynthesizerOptions = SynthesizeSpeechRequest;

export interface ITextToSpeechVoice {
  languageCodes: string[];
  name: string;
  ssmlGender: EVoiceGender;
  naturalSampleRateHertz: number;
}

export type SynthesizerType = 'article' | 'preview';
export type SynthesizerAudioEncodingTypes = GoogleAudioEncoding & Polly.OutputFormat;

export enum SynthesizerEncoding {
  GOOGLE_MP3 = 'MP3',
  GOOGLE_OGG_OPUS = 'OGG_OPUS',
  GOOGLE_LINEAR16 = 'LINEAR16',
  AWS_MP3 = 'mp3',
  AWS_PCM = 'pcm',
  AWS_OGG_VORBIS = 'ogg_vorbis'
}

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
  private readonly synthesizerName: string;
  private readonly baseUrl: string;
  private readonly audiofileRepository: Repository<Audiofile>;
  private readonly bucketName: string;

  constructor(synthesizerName: EVoiceSynthesizer) {
    super()

    this.synthesizerName = synthesizerName.toLowerCase(); // Google -> google, AWS -> aws
    this.baseUrl = 'https://playpost-synthesizer-ue5zwn5yja-ew.a.run.app';
    this.audiofileRepository = getRepository(Audiofile);
    this.bucketName = `${process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME}`;
  }

  /**
   * Converts the given mimeType to the correct encoding parameter for the synthesizer service to use.
   *
   * For example: when someone requests an article text to be synthesized into a "audio/mpeg" file, the synthesizer will use the parameter:
   * { "audioConfig": { "audioEncoding": "MP3" } } (Google)
   * or
   * { "OutputFormat": "mp3" } (AWS)
   *
   */
  public mimeTypeToFormat = (mimeType: AudiofileMimeType): SynthesizeOutputFormat => {
    if (mimeType === 'audio/mpeg') {
      return 'mp3'
    }

    return 'wav';
  };

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
  public uploadArticleAudio = async (articleId: string, userId: string, voiceId: string, options: UploadOptions): Promise<Audiofile> => {
    // Manually generate a UUID.
    // So we can use this ID to upload a file to storage, before we insert it into the database.
    const audiofileId = uuid.v4();

    const bucketUploadDestination = `articles/${articleId}/audiofiles/${audiofileId}.${options.outputFormat}`;

    const response: SynthesizeUploadResponse = await this.synthesize(
      'upload',
      {
        ...options,
        bucketName: this.bucketName,
        bucketUploadDestination
      }
    );

    // Return an audiofile object we can store in the database
    const newAudiofile = this.audiofileRepository.create({
      id: audiofileId,
      article: {
        id: articleId
      },
      user: {
        id: userId
      },
      voice: {
        id: voiceId
      }
    });

    newAudiofile.url = response.publicFileUrl;
    newAudiofile.bucket = this.bucketName;
    newAudiofile.filename = bucketUploadDestination;
    newAudiofile.length = response.durationInSeconds;

    return newAudiofile;
  }

  public uploadVoicePreview = async (voiceId: string, options: UploadOptions): Promise<SynthesizeUploadResponse> => {
    const bucketUploadDestination = `voices/${voiceId}.${options.outputFormat}`;

    const response: SynthesizeUploadResponse = await this.synthesize(
      'upload',
      {
        ...options,
        bucketName: this.bucketName,
        bucketUploadDestination
      }
    );

    return response
  }

  /**
   * Does a request to get the status of the synthesizer.
   */
  public getStatus = async () => {
    const response = await nodeFetch(`${this.baseUrl}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.SYNTHESIZER_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const json = await response.json();

    return json;
  }

  /**
   * Get's all the voices from the chosen synthesizer.
   */
  public getAllVoices = async () => {
    const response = await nodeFetch(`${this.baseUrl}/v1/synthesize/${this.synthesizerName}/voices`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.SYNTHESIZER_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const json = await response.json();

    return json;
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

    const response = await nodeFetch(`${this.baseUrl}/v1/synthesize/${this.synthesizerName}/${action}`, {
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
