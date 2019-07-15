import fsExtra from 'fs-extra';
import { EntityRepository, getConnection, Repository } from 'typeorm';
import * as storage from '../../storage/google-cloud';
import { SynthesizerEncoding } from '../../synthesizers';
import { AwsSynthesizer } from '../../synthesizers/aws';
import { googleSSMLToSpeech } from '../../synthesizers/google';
import { getAudioFileDurationInSeconds } from '../../utils/audio';
import { AudiofileMimeType } from '../entities/audiofile';
import { Voice } from '../entities/voice';

@EntityRepository(Voice)
export class VoiceRepository extends Repository<Voice> {

  public async createVoicePreview(voiceId: string): Promise<Voice> {
    let localAudiofilePath: string = '';
    let audioEncoding: SynthesizerEncoding;
    let mimeType: AudiofileMimeType;

    const voice = await this.findOne(voiceId);

    if (!voice) { throw new Error('Voice not found, cannot create preview.'); }

    // tslint:disable max-line-length
    const ssml = {
      English: [
        `<speak>
          <p>The Moon is an astronomical body that orbits planet Earth and is Earth's only permanent natural satellite. It is the fifth-largest natural satellite in the Solar System, and the largest among planetary satellites relative to the size of the planet that it orbits (its primary).</p>
          <p>The Moon is after Jupiter's satellite Io the second-densest satellite in the Solar System among those whose densities are known.</p>
          <p>The Moon is thought to have formed about 4.51 billion years ago, not long after Earth. The most widely accepted explanation is that the Moon formed from the debris left over after a giant impact between Earth and a Mars-sized body called Theia.</p>
        </speak>`,
        `<speak>
          <p>Mars is the fourth planet from the Sun and the second-smallest planet in the Solar System after Mercury.</p>
          <p>In English, Mars carries a name of the Roman god of war, and is often referred to as the "Red Planet" because the iron oxide prevalent on its surface gives it a reddish appearance that is distinctive among the astronomical bodies visible to the naked eye.</p>
          <p>Mars is a terrestrial planet with a thin atmosphere, having surface features reminiscent both of the impact craters of the Moon and the valleys, deserts, and polar ice caps of Earth.</p>
        </speak>`,
        `<speak>
          <p>Earth is the third planet from the Sun and the only astronomical object known to harbor life. According to radiometric dating and other sources of evidence, Earth formed over 4.5 billion years ago.</p>
          <p>Earth's gravity interacts with other objects in space, especially the Sun and the Moon, Earth's only natural satellite. Earth revolves around the Sun in 365.26 days, a period known as an Earth year. During this time, Earth rotates about its axis about 366.26 times.</p>
        </speak>`
      ],
      Dutch: [
        `<speak>
          <p>De Maan is de enige natuurlijke satelliet van de Aarde en is een van de 5 grootste manen van ons zonnestelsel. Ze wordt soms aangeduid met haar Latijnse naam Luna.</p>
          <p>De meeste manen in het Zonnestelsel zijn erg klein, maar er zijn enkele grote, planeetachtige manen. Onze maan hoort daar ook bij. Hoewel er manen in het Zonnestelsel zijn die nog groter zijn dan onze maan (te weten Ganymedes, Titan, Callisto en Io), worden de Aarde en de Maan wel als dubbelplaneet aangeduid, omdat de Maan in vergelijking met de Aarde niet zeer klein is: de massa van de Maan is 1/81 van die van de Aarde.</p>
          <p>Het gemeenschappelijk zwaartepunt waar Aarde en Maan omheen draaien, ligt echter nog binnen de Aarde.</p>
          <p>Alleen bij de dwergplaneet Pluto en zijn maan Charon is de maan naar verhouding nóg groter, namelijk 1/8 van de planeetmassa, en ligt het gemeenschappelijk zwaartepunt buiten Pluto.</p>
        </speak>
        `,
        `<speak>
          <p>Mars is vanaf de zon geteld de vierde planeet van ons zonnestelsel, om de zon draaiend in een baan tussen die van de Aarde en die van Jupiter.</p>
          <p>De planeet is kleiner dan de Aarde en met een (maximale) magnitude van -2,9 minder helder dan Venus en meestal minder helder dan Jupiter.</p>
          <p>Mars wordt wel de rode planeet genoemd maar is in werkelijkheid eerder okerkleurig. De planeet is vernoemd naar de Romeinse god van de oorlog.</p>
          <p>Mars is gemakkelijk met het blote oog te bespeuren, vooral in de maanden rond een oppositie. 's Nachts is Mars dan te zien als een heldere roodachtige "ster" die evenwel door haar relatieve nabijheid geen puntbron is maar een schijfje. Daarom flonkert Mars niet zoals bv. de verre rode reuzenster Aldebaran.</p>
        </speak>`,
        `<speak>
          <p>De Aarde (soms de wereld of Terra genoemd) is vanaf de Zon gerekend de derde planeet van ons zonnestelsel. Hierin behoort ze tot de naar haar genoemde "aardse planeten", waarvan ze zowel qua massa als qua volume de grootste is.</p>
          <p>Op de Aarde komt leven voor: ze is de woonplaats van miljoenen soorten organismen.</p>
          <p>Of ze daarin alleen staat is onduidelijk, maar in de rest van het heelal zijn tot nog toe nergens sporen van leven, nu of in het verleden, gevonden.</p>
          <p>Radiometrische dateringen hebben uitgewezen dat de Aarde 4,57 miljard jaar geleden is ontstaan en het leven maximaal 1 miljard jaar daarna.</p>
        </speak>`
      ],
      German: [
        `<speak>
          <p>Der Mond ist der einzige natürliche Satellit der Erde. Sein Name ist etymologisch verwandt mit Monat und bezieht sich auf die Periode seines Phasenwechsels.</p>
          <p>Weil aber die Trabanten anderer Planeten des Sonnensystems im übertragenen Sinn meistens ebenfalls als Monde bezeichnet werden, spricht man zur Vermeidung von Verwechslungen mitunter vom Erdmond.</p>
          <p>Er ist mit einem Durchmesser von 3476 km der fünftgrößte Mond des Sonnensystems und der größte Mond im Verhältnis zu dem Planeten, den er begleitet.</p>
        </speak>`,
        `<speak>
          <p>Der Mars ist, von der Sonne aus gezählt, der vierte Planet im Sonnensystem und der äußere Nachbar der Erde.</p>
          <p>Er zählt zu den erdähnlichen (terrestrischen) Planeten. Sein Durchmesser ist mit knapp 6800 Kilometer etwa halb so groß wie der der Erde, sein Volumen beträgt gut ein Siebtel des Erdvolumens.</p>
          <p>Damit ist der Mars nach dem Merkur der zweitkleinste Planet des Sonnensystems, hat jedoch eine vielfältige Geologie und die höchsten Vulkane des Sonnensystems.</p>
          <p>Mit einer durchschnittlichen Entfernung von 228 Millionen Kilometern ist er rund 1,5-mal so weit von der Sonne entfernt wie die Erde.</p>
        </speak>`,
        `<speak>
          <p>Die Erde ist der dichteste, fünftgrößte und der Sonne drittnächste Planet des Sonnensystems. Sie ist Ursprungsort und Heimat aller bekannten Lebewesen.</p>
          <p>Ihr Durchmesser beträgt mehr als 12.700 Kilometer und ihr Alter etwa 4,6 Milliarden Jahre. Nach ihrer vorherrschenden geochemischen Beschaffenheit wurde der Begriff der "erdähnlichen Planeten" geprägt.</p>
          <p>Da die Erdoberfläche zu etwa zwei Dritteln aus Wasser besteht und daher die Erde vom All betrachtet vorwiegend blau erscheint, wird sie auch Blauer Planet genannt. Sie wird metaphorisch auch als "Raumschiff Erde" bezeichnet.</p>
        </speak>`
      ],
      French: [
        `<speak>
          <p>La Terre s'est formée il y a 4,54 milliards d'années environ et la vie y est apparue moins d'un milliard d'années plus tard.</p>
          <p>La planète abrite des millions d'espèces vivantes, dont les humains.</p>
          <p>La biosphère de la Terre a fortement modifié l'atmosphère et les autres caractéristiques abiotiques de la planète, permettant la prolifération d'organismes aérobies de même que la formation d'une couche d'ozone qui, associée au champ magnétique terrestre, bloque une partie du rayonnement solaire, permettant ainsi la vie sur Terre.</p>
          <p>Les propriétés physiques de la Terre, de même que son histoire géologique et son orbite, ont permis à la vie de subsister durant cette période. De plus, la Terre devrait pouvoir maintenir la vie (telle que nous la connaissons actuellement) durant encore au moins 500 millions d'années.</p>
        </speak>`,
        `<speak>
          <p>La Lune, ou Terre I, est un objet céleste qui orbite autour de la planète Terre et le seul satellite naturel permanent de la Terre.</p>
          <p>C'est le cinquième plus grand satellite naturel du Système solaire et le plus grand des satellites planétaires par rapport à la taille de la planète autour de laquelle elle orbite.</p>
          <p>La Lune est, après le satellite de Jupiter Io, le deuxième satellite le plus dense du Système solaire parmi ceux dont la densité est connue.</p>
          <p>On pense que la Lune s'est formée il y a environ 4,51 milliards d'années, peu de temps après la Terre. L'explication la plus largement acceptée est que la Lune s'est formée à partir des débris restants après un impact géant entre la Terre et un corps de la taille de Mars appelé Theia.</p>
        </speak>`,
        `<speak>
          <p>Mars est la quatrième planète par ordre de distance croissante au Soleil et la deuxième par masse et par taille croissantes.</p>
          <p>Son éloignement au Soleil est compris entre 1,381 et 1,666 UA (206,6 à 249,2 millions de kilomètres), avec une période orbitale de 669,58 jours martiens (686,71 jours terrestres).</p>
          <p>C’est une planète tellurique, comme le sont Mercure, Vénus et la Terre, environ dix fois moins massive que la Terre mais dix fois plus massive que la Lune.</p>
          <p>Sa topographie présente des analogies aussi bien avec la Lune, à travers ses cratères et ses bassins d'impact, qu'avec la Terre, avec des formations d'origine tectonique et climatique telles que des volcans, des rifts, des vallées, des mesas, des champs de dunes et des calottes polaires.</p>
          <p>La plus grande montagne du Système solaire, Olympus Mons (qui est aussi un volcan bouclier), et le plus grand canyon, Valles Marineris, se trouvent sur Mars.</p>
        </speak>`
      ],
      Spanish: [
        `<speak>
          <p>Marte es el cuarto planeta en orden de distancia al Sol y el segundo más pequeño del sistema solar, después de Mercurio.</p>
          <p>Recibió su nombre en homenaje al dios de la guerra de la mitología romana (Ares en la mitología griega), y también es conocido como "el planeta rojo"3​ 4​ debido a la apariencia rojiza5​ que le confiere el óxido de hierro predominante en su superficie.</p>
          <p>Marte es el planeta interior más alejado del Sol. Es un planeta telúrico con una atmósfera delgada de dióxido de carbono, y posee dos satélites pequeños y de forma irregular, Fobos y Deimos (hijos del dios griego), que podrían ser asteroides capturados6​7​ similares al asteroide troyano (5261) Eureka.</p>
          <p>Sus características superficiales recuerdan tanto a los cráteres de la Luna como a los valles, desiertos y casquetes polares de la Tierra.</p>
        </speak>`,
        `<speak>
          <p>La Luna es el único satélite natural de la Tierra. Con un diámetro ecuatorial de 3474 km, es el quinto satélite más grande del sistema solar, mientras que en cuanto al tamaño proporcional respecto a su planeta es el satélite más grande: un cuarto del diámetro de la Tierra y 1/81 de su masa.</p>
          <p>Después de Ío, es además el segundo satélite más denso. Se encuentra en relación síncrona con la Tierra, siempre mostrando la misma cara hacia el planeta.</p>
          <p>El hemisferio visible está marcado con oscuros mares lunares de origen volcánico entre las brillantes montañas antiguas y los destacados astroblemas.</p>
        </speak>`,
        `<speak>
          <p>La Tierra (del latín Terra deidad romana equivalente a Gea, diosa griega de la feminidad y la fecundidad) es un planeta del sistema solar que gira alrededor de su estrella —el Sol— en la tercera órbita más interna.</p>
          <p>Es el más denso y el quinto mayor de los ocho planetas del sistema solar. También es el mayor de los cuatro terrestres o rocosos.</p>
          <p>La Tierra se formó hace aproximadamente 4550 millones de años y la vida surgió unos mil millones de años después. Es el hogar de millones de especies, incluyendo los seres humanos y actualmente el único cuerpo astronómico donde se conoce la existencia de vida.</p>
        </speak>`
      ]
    };

     // Get the correct SSML based on the language
    const randomIndex = Math.floor(Math.random() * 3);
    const previewSsml = (ssml[voice.language.name]) ? ssml[voice.language.name][randomIndex] : null;

    if (!previewSsml) { throw new Error('Cannot create a voice preview, because there is no SSML for this language.'); }

    if (!['Google', 'AWS'].includes(voice.synthesizer)) { throw new Error('Voice synthesizer not supported.'); }

    if (voice.synthesizer === 'Google') {
      audioEncoding = SynthesizerEncoding.GOOGLE_LINEAR16;
      mimeType = AudiofileMimeType.WAV;

      // Step 1: Prepare the config
      const synthesizerOptions = {
        audioConfig: {
          audioEncoding
        },
        voice: {
          languageCode: voice.languageCode,
          name: voice.name,
          ssmlGender: voice.gender
        },
        input: {
          ssml: previewSsml
        }
      };

      // Step 2: Send the SSML parts to Google's Text to Speech API and download the audio files
      localAudiofilePath = await googleSSMLToSpeech(
        0,
        synthesizerOptions.input.ssml,
        'preview',
        voice.id,
        synthesizerOptions,
        voice.id
      );

    } else if (voice.synthesizer === 'AWS') {
      const awsSynthesizer = new AwsSynthesizer();
      audioEncoding = SynthesizerEncoding.AWS_MP3;
      mimeType = AudiofileMimeType.MP3;

      // Step 1: Prepare the config
      const synthesizerOptions = {
        VoiceId: voice.name,
        LanguageCode: voice.languageCode,
        OutputFormat: audioEncoding,
        TextType: 'ssml',
        Text: previewSsml
      };

      // Step 2: Send the SSML parts to Google's Text to Speech API and download the audio files
      localAudiofilePath = await awsSynthesizer.SSMLToSpeech(
        0,
        synthesizerOptions.Text,
        'preview',
        voice.id,
        synthesizerOptions,
        voice.id
      );

    } else {
      throw new Error('Synthesizer could not be found.');
    }

    // Step 3: Get the length of the audiofile
    const audiofileLength = await getAudioFileDurationInSeconds(localAudiofilePath);

    // Step 4: Upload the file to Google Cloud Storage
    const uploadResponse = await storage.uploadVoicePreviewAudiofile(
      voice,
      localAudiofilePath,
      mimeType,
      audiofileLength
    );

    // Step 6: Delete the local file, we don't need it anymore
    await fsExtra.remove(localAudiofilePath);

    // Step 7: Create a publicfile URL our users can use
    const publicFileUrl = storage.getPublicFileUrl(uploadResponse);

    await this.update(voice.id, {
      exampleAudioUrl: publicFileUrl
    });

    // When we have updated a voice, remove all related caches
    const cache = await getConnection('default').queryResultCache;
    if (cache) { await cache.remove(['voices_all', 'voices_active', 'voices_active_free', 'voices_active_premium']); }

    const updatedVoice = await this.findOne(voice.id);

    if (!updatedVoice) { throw new Error('Updated voice not found.'); }

    return updatedVoice;
  }
}
