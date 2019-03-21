require('dotenv').config();
import AWS, { Polly } from 'aws-sdk';
// import fsExtra from 'fs-extra';

import { SynthesizerOptions } from '../synthesizers';
import { Article } from 'database/entities/article';
import { Audiofile } from 'database/entities/audiofile';


// import { awsSsmlToSpeech } from './synthesizers/aws';

// (async () => {
//   const ssml = `<speak><p>Why Instagram Made Multi-Photo Posts More Annoyin.</p><p>It’s all about the engagemen.</p><p>Ann-Derrick Gaillot Blocked Unblock Follow Following Mar 1.</p><p>Photo by Kate Torline on Unsplas.</p><p>Two years ago, Instagram changed our feeds forever with the introduction of multi-photo posts. Users could now choose up to 10 images to display, in precisely the order they want to display them. “Create a step-by-step cake recipe that people can always find on your profile,” the company suggested in its announcement.</p><p>Something has changed since then. Multi-photo posts will now often start on the second image in a series. These “photo nudges,” as I call them, seem to occur when you scroll past an image without engaging with it. Instagram’s algorithm, growing smarter every day through the data users create, reinserts these series into your feed disguised as something new by “nudging” the second image forward. Whenever this happens, Instagram’s watching eye suddenly becomes a visible presence in my experience, and an annoying one at that.</p><p>Instagram did not return a request for comment about photo nudges, but a few design experts had some thoughts. As you’d expect, there’s a good chance the move is all about Instagram’s bottom line — and not your own experience with the app.</p><p>“It’s all in the pursuit of engagement, making sure that when you log in, you keep seeing posts that resonate with you,” says Kate Moran, a user experience specialist at Nielsen Norman Group. She adds that the feature might also “encourage and make sure that the posts that you submit are getting likes, so that you’re more motivated to keep posting in the future..</p><p>Moran was quick to point out that she’s just speculating, but her point makes sense. “Presumably, people are probably organizing those multiple-photo posts in some sort of meaningful way,” she says, but Instagram prioritizes engagement and algorithmically sorts your timeline as is. Rearranging the images within a multi-photo post could be just another way to encourage interactions from viewers.</p><p>That theory, she says, helps explain other features, like notifications encouraging people to interact with posts from what the company defines as “at-risk users” — those who use and post to the app infrequently.</p><p>“It’s all in the pursuit of engagement..</p><p>Frank Garofalo, principal consultant at Garofalo UX, also speculates that the second-photo feature could be a fix for users who are accustomed to vertical scrolling, but not necessarily the horizontal swiping required of multi-photo posts.</p><p>“If their analytics of usage was showing that, across the board, there was a low use of scrolling through multiple photos of a single post, this might be an attempt to try to increase those analytics and that actual usage count,” he says.</p><p>That begs another question: does the format even make much sense to begin with? Instagram is all about moving through a vertical space. Kevin P. Nichols, executive director of experience at AvenueCX, for one, says multi-photo posts disrupt user expectations.</p><p>“It’s mimicking the functionality of a carousel,” he says. “I think there’s better design approaches to do it than what we’re seeing here..</p><p>Nichols suggests multi-photo posts displayed in single, gridded tile may be easier to interact with. A horizontal scroll for the feed could be another option that more naturally matches the multi-photo feature, though Instagram tested that in December — and immediately faced a user revolt.</p><p>In any case, the multi-photo feature signals a departure from Instagram’s initial functionality.</p><p>“The point of Instagram is you’re trying to showcase a particular image or idea or theme and then comment on it, so multi-photo posts kind of defeats that purpose and dilutes that purpose,” Nichols says.</p><p>So, the next time you’re alone absentmindedly thumbing through your feed while sitting on the couch or the toilet, you may come across an interesting photo only to swipe left and realize it’s a post you had seen before. In that moment of technological deja vu, remember that Instagram is always watching — and changing based on what you do.</p></speak>`;
//   const articleId = 'test-article';
//   const audiofileId = 'test-audio';
//   const response = await awsSsmlToSpeech(ssml, articleId, audiofileId);
//   console.log('AWS response', response);
// })();


// // Create an Polly client
const polly = new Polly({
  signatureVersion: 'v4',
  region: 'eu-central-1'
});

export const awsSsmlToSpeech = (
  ssml: string,
  articleId: string,
  audiofileId: string,
  // synthesizerOptions: SynthesizerOptions
): Promise<string | {}> => {
  return new Promise((resolve, reject) => {
    // const audioFilePath = `${appRootPath}/temp/${synthesizerOptions.source}/${mediumPostId}/${mediumPostId}-${index}.mp3`;

    // TODO: use SSML
    // TODO: use voice from synthesizerOptions
    const params: Polly.Types.StartSpeechSynthesisTaskInput = {
      // Text: '<speak><p>Test text to speech using AWS Polly!</p></speak>',
      Text: ssml,
      OutputFormat: 'mp3', /* required */
      OutputS3BucketName: 'synthesized-audio-files', /* required */
      VoiceId: 'Joanna', /* required */ /* Brian, is also a good voice, male british */
      LanguageCode: 'en-US',
      OutputS3KeyPrefix: `${articleId}/${audiofileId}`,
      // SampleRate: 'STRING_VALUE',
      // SnsTopicArn: 'STRING_VALUE',
      // SpeechMarkTypes: [
      //   sentence | ssml | viseme | word,
      //   /* more items */
      // ],
      TextType: 'ssml'
    };

    console.log('AWS Polly', 'Starting startSpeechSynthesisTask()...');

    polly.startSpeechSynthesisTask(params, (error, response) => {
      if (error) return reject(error);

      if (!response) return reject(new Error('AWS Polly: Received no response from synthesizeSpeech()'));

      // console.log('Got response');
      // console.log(response);

      const taskId = response.SynthesisTask.TaskId;

      console.log('AWS Polly', 'Got a task:', taskId);

      if (taskId) {
        // Use an interval to check for the status of the task
        const interval = setInterval(() => {
          console.log('AWS Polly', 'Checking task using getSpeechSynthesisTask, task:', taskId);
          polly.getSpeechSynthesisTask({ TaskId: taskId }, (err, data) => {
            console.log('AWS Polly', 'Got response getSpeechSynthesisTask, task:', taskId);
            if (error) {
              console.log('AWS Polly', 'Got error, task:', taskId);
              clearInterval(interval);
              return reject(error);
            }

            if (data.SynthesisTask.TaskStatus === 'completed') {
              console.log('AWS Polly', 'Task completed, task:', taskId);
              clearInterval(interval);
              return resolve(data);
            }
          });
        }, 1000);

      }
    });
  });
};

// export const awsSsmlPartsToSpeech = (id: string, ssmlParts: string[], synthesizerOptions: SynthesizerOptions) => {
//   const promises: Promise<any>[] = [];

//   ssmlParts.forEach((ssmlPart: string, index: number) => {
//     return promises.push(awsSsmlToSpeech(id, ssmlPart, index, synthesizerOptions))
//   });

//   return Promise.all(promises);
// };
