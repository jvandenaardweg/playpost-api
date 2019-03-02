import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, JoinColumn, ManyToOne, Index, AfterRemove, BeforeInsert } from 'typeorm';
import { IsUUID } from 'class-validator';
import appRootPath from 'app-root-path';
import { Article } from './article';
import * as utils from '../../utils';
import { ssmlPartsToSpeech } from '../../synthesizers';
import * as storage from '../../storage/google-cloud';
import { getAudioFileDurationInSeconds } from '../../utils/audio';

@Entity()
@Index(['article'])
export class Audiofile {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ nullable: true })
  url: string;

  @Column({ nullable: true })
  bucket: string;

  @Column({ nullable: true })
  filename: string;

  @Column({ type: 'decimal', nullable: true })
  lengthInSeconds: number;

  @Column({ nullable: true })
  languageCode: string;

  @Column({ nullable: true })
  encoding: string;

  @Column({ nullable: true })
  extension: string;

  @Column({ nullable: true })
  voice: string;

  @Column({ nullable: true })
  synthesizer: string;

  @Column({ nullable: false, default: 0 })
  partialPlays: number;

  @Column({ nullable: false, default: 0 })
  completedPlays: number;

  @Column({ nullable: true })
  lastPlayedAt: Date;

  @ManyToOne(type => Article, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  article: Article;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // https://github.com/typeorm/typeorm/issues/1137#issuecomment-345653493
  @AfterRemove()
  afterRemove() {
    console.log('Should delete the audiofile from storage:', this.bucket, this.filename);
  }

  // @BeforeInsert()
  // beforeInsert() {
  //   return new Promise(async (resolve, reject) => {
  //     console.log(`Should generate an audiofile using audiofileId "${this.id}", articleId "${this.article.id}", synthesizer "${this.synthesizer}" and voice "${this.voice}."`);
  //     console.log(`Should upload the audiofile to storage using audiofileId "${this.id}", articleId "${this.article.id}" and the metadata of the article.`);

  //     const audiofileId = this.id; // The audiofile ID this new insert gets
  //     const articleId = this.article.id;
  //     const storageUploadPath = `${articleId}/${audiofileId}`; // something like this: 1e01cc10-475c-4221-aad0-33a1f611ca2d/7346f12b-1122-4faf-95df-1740f2168861

  //     const { ssml, sourceName } = this.article;

  //     const synthesizerOptions = {
  //       synthesizer: 'Google', // or Amazon
  //       languageCode: 'en-US', // or en-GB, en-AU
  //       name: 'en-US-Wavenet-D', // or en-GB-Wavenet-A
  //       source: sourceName // or cnn-com
  //     };

  //     // Split the SSML data in parts so we don't reach the character limit (5000)
  //     const ssmlParts = utils.ssml.getSSMLParts(ssml);

  //     // Send the SSML parts to Google's Text to Speech API and download the audio files
  //     const localAudiofilePaths = await ssmlPartsToSpeech(
  //       articleId,
  //       ssmlParts,
  //       synthesizerOptions,
  //       storageUploadPath
  //     );

  //     // Concatinate the different files into one .mp3 file
  //     const concatinatedLocalAudiofilePath = await utils.audio.concatAudioFiles(
  //       articleId,
  //       localAudiofilePaths,
  //       synthesizerOptions,
  //       storageUploadPath
  //     );

  //     const audiofileLengthInSeconds = await getAudioFileDurationInSeconds(concatinatedLocalAudiofilePath);

  //     // Upload the one mp3 file to Google Cloud Storage
  //     const uploadResponse = await storage.uploadFile(
  //       concatinatedLocalAudiofilePath,
  //       storageUploadPath,
  //       synthesizerOptions
  //     );

  //     // Create a publicfile URL our users can use
  //     const publicFileUrl = storage.getPublicFileUrl(uploadResponse);

  //     // Store all this data in a database
  //     this.url = publicFileUrl;
  //     this.bucket = uploadResponse[0].bucket.name;
  //     this.filename = uploadResponse[0].name;
  //     this.length = audiofileLengthInSeconds;
  //     this.languageCode = synthesizerOptions.languageCode;
  //     this.encoding = 'mp3';
  //     this.voice = synthesizerOptions.name;
  //     this.synthesizer = synthesizerOptions.synthesizer;

  //     // Cleanup the local audiofiles, we don't need that anymore
  //     await utils.local.removeFile(
  //       `${appRootPath}/temp/${storageUploadPath}`,
  //     );

  //     resolve(this);
  //   });
  // }
}

/*

[articleId]/[audiofileId].mp3

23123-123123-21312/12323-23543-7685.mp3
*/
