import fsExtra from 'fs-extra';
import { EntityRepository, getConnection, Repository } from 'typeorm';
import * as storage from '../../storage/google-cloud';
import { SynthesizerEncoding } from '../../synthesizers';
import { AwsSynthesizer } from '../../synthesizers/aws';
import { GoogleSynthesizer } from '../../synthesizers/google';
import { getAudioFileDurationInSeconds } from '../../utils/audio';
import { AudiofileMimeType } from '../entities/audiofile';
import { Voice } from '../entities/voice';

@EntityRepository(Voice)
export class VoiceRepository extends Repository<Voice> {

  async createVoicePreview(voiceId: string): Promise<Voice> {
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
      ],
      Polish: [
        `<speak>
          <p>Ziemia trzecia, licząc od Słońca, oraz piąta pod względem wielkości planeta Układu Słonecznego. Pod względem średnicy, masy i gęstości jest to największa planeta skalista Układu Słonecznego.</p>
          <p>Ziemia jest zamieszkana przez miliony gatunków, w tym przez człowieka. Jest jedynym znanym miejscem we Wszechświecie, w którym występuje życie.</p>
          <p>Według danych zebranych metodą datowania izotopowego, planeta uformowała się ok. 4,54 ± 0,05 mld lat temu.</p>
        </speak>`,
        `<speak>
          <p>Księżyc jedyny naturalny satelita Ziemi (nie licząc tzw. księżyców Kordylewskiego, które są obiektami pyłowymi i przez niektórych badaczy uważane za obiekty przejściowe).</p>
          <p>Jest piątym co do wielkości księżycem w Układzie Słonecznym.</p>
          <p>Przeciętna odległość od środka Ziemi do środka Księżyca to 384 399 km, co stanowi mniej więcej trzydziestokrotność średnicy ziemskiej.</p>
        </speak>`,
        `<speak>
          <p>Mars, czwarta od Słońca planeta Układu Słonecznego. Nazwana od imienia rzymskiego boga wojny – Marsa.</p>
          <p>Zawdzięcza ją barwie, która przy obserwacji z Ziemi wydaje się rdzawo-czerwona i kojarzyła się starożytnym Rzymianom z pożogą wojenną.</p>
          <p>Odcień bierze się od tlenków żelaza pokrywających powierzchnię. Mars jest planetą wewnętrzną z cienką atmosferą, o powierzchni usianej kraterami uderzeniowymi, podobnie jak powierzchnia Księżyca i wielu innych ciał Układu Słonecznego.</p>
        </speak>`
      ],
      Hindi: [
        `<speak>
          <p>पृथ्वी, जिसे विश्व भी कहा जाता है, सूर्य से तीसरा ग्रह और ज्ञात ब्रह्माण्ड में एकमात्र ग्रह है जहाँ जीवन उपस्थित है। यह सौर मंडल में सबसे घना और चार स्थलीय ग्रहों में सबसे बड़ा ग्रह है।</p>
          <p>रेडियोधर्मी डेटिंग और साक्ष्य के अन्य स्रोतों के अनुसार, पृथ्वी की आयु लगभग 4.54 बिलियन साल हैं। पृथ्वी की गुरुत्वाकर्षण, अंतरिक्ष में अन्य पिण्ड के साथ परस्पर प्रभावित रहती है, विशेष रूप से सूर्य और चंद्रमा से, जोकि पृथ्वी का एकमात्र प्राकृतिक उपग्रह हैं।</p>
          <p>सूर्य के चारों ओर परिक्रमण के दौरान, पृथ्वी अपनी कक्षा में 365 बार घूमती है; इस प्रकार, पृथ्वी का एक वर्ष लगभग 365.26 दिन लंबा होता है। पृथ्वी के परिक्रमण के दौरान इसके धुरी में झुकाव होता है, जिसके कारण ही ग्रह की सतह पर मौसमी विविधताये (ऋतुएँ) पाई जाती हैं।</p>
          <p>पृथ्वी और चंद्रमा के बीच गुरुत्वाकर्षण के कारण समुद्र में ज्वार-भाटे आते है, यह पृथ्वी को इसकी अपनी अक्ष पर स्थिर करता है, तथा इसकी परिक्रमण को धीमा कर देता है।</p>
        </speak>`,
        `<speak>
          <p>चन्द्रमा पृथ्वी का एकमात्र प्राकृतिक उपग्रह है। यह सौर मंडल का पाचवाँ,सबसे विशाल प्राकृतिक उपग्रह है। इसका आकार क्रिकेट बॉल की तरह गोल है।</p>
          <p>और यह खुद से नहीं चमकता बल्कि यह तो सूर्य के प्रकाश से प्रकाशित होता है। पृथ्वी से चन्द्रमा की दूरी ३८४,४०३ किलोमीटर है। यह दूरी पृथ्वी कि परिधि के ३० गुना है। चन्द्रमा पर गुरुत्वाकर्षण पृथ्वी से १/६ है।</p>
          <p>यह पृथ्वी कि परिक्रमा २७.३ दिन में पूरा करता है और अपने अक्ष के चारो ओर एक पूरा चक्कर भी २७.३ दिन में लगाता है। यही कारण है कि चन्द्रमा का एक ही हिस्सा या फेस हमेशा पृथ्वी की ओर होता है।</p>
          <p>यदि चन्द्रमा पर खड़े होकर पृथ्वी को देखे तो पृथ्वी साफ़ साफ़ अपने अक्ष पर घूर्णन करती हुई नजर आएगी लेकिन आसमान में उसकी स्थिति सदा स्थिर बनी रहेगी अर्थात पृथ्वी को कई वर्षो तक निहारते रहो वह अपनी जगह से टस से मस नहीं होगी।</p>
          <p>पृथ्वी- चन्द्रमा-सूर्य ज्यामिति के कारण "चन्द्र दशा" हर २९.५ दिनों में बदलती है।</p>
        </speak>`,
        `<speak>
          <p>मंगल सौरमंडल में सूर्य से चौथा ग्रह है। पृथ्वी से इसकी आभा रक्तिम दिखती है, जिस वजह से इसे "लाल ग्रह" के नाम से भी जाना जाता है।</p>
          <p>सौरमंडल के ग्रह दो तरह के होते हैं - "स्थलीय ग्रह" जिनमें ज़मीन होती है और "गैसीय ग्रह" जिनमें अधिकतर गैस ही गैस है। पृथ्वी की तरह, मंगल भी एक स्थलीय धरातल वाला ग्रह है। इसका वातावरण विरल है।</p>
          <p>इसकी सतह देखने पर चंद्रमा के गर्त और पृथ्वी के ज्वालामुखियों, घाटियों, रेगिस्तान और ध्रुवीय बर्फीली चोटियों की याद दिलाती है। हमारे सौरमंडल का सबसे अधिक ऊँचा पर्वत, ओलम्पस मोन्स मंगल पर ही स्थित है। साथ ही विशालतम कैन्यन वैलेस मैरीनेरिस भी यहीं पर स्थित है।</p>
          <p>अपनी भौगोलिक विशेषताओं के अलावा, मंगल का घूर्णन काल और मौसमी चक्र पृथ्वी के समान हैं। इस गृह पर जीवन होने की संभावना है।</p>
        </speak>`
      ],
      Russian: [
        `<speak>
          <p>Земля́ — третья по удалённости от Солнца планета Солнечной системы. Самая плотная, пятая по диаметру и массе среди всех планет и крупнейшая среди планет земной группы, в которую входят также Меркурий, Венера и Марс.</p>
          <p>Иногда упоминается как Мир, Голубая планета, иногда Терра (от лат. Terra). Единственное известное человеку на данный момент тело Солнечной системы в частности и Вселенной вообще, населённое живыми организмами.</p>
        </speak>`,
        `<speak>
          <p>Луна́ — естественный спутник Земли. Самый близкий к Солнцу спутник планеты, так как у ближайших к Солнцу планет, Меркурия и Венеры, спутников нет.</p>
          <p>Второй по яркости объект на земном небосводе после Солнца и пятый по величине естественный спутник планеты Солнечной системы. Среднее расстояние между центрами Земли и Луны — 384 467 км (0,002 57 а. е., ~ 30 диаметров Земли).</p>
        </speak>`,
        `<speak>
          <p>Марс — четвёртая по удалённости от Солнца и седьмая по размерам планета Солнечной системы; масса планеты составляет 10,7 % массы Земли.</p>
          <p>Названа в честь Марса — древнеримского бога войны, соответствующего древнегреческому Аресу. Иногда Марс называют «красной планетой» из-за красноватого оттенка поверхности, придаваемого ей минералом маггемитом — γ-оксидом железа(III).</p>
        </speak>`
      ],
      Portuguese: [
        `<speak>
          <p>A Terra é o terceiro planeta mais próximo do Sol, o mais denso e o quinto maior dos oito planetas do Sistema Solar. É também o maior dos quatro planetas telúricos.</p>
          <p>É por vezes designada como Mundo ou Planeta Azul. Lar de milhões de espécies de seres vivos, incluindo os humanos, a Terra é o único corpo celeste onde é conhecida a existência de vida.</p>
          <p>O planeta formou-se há 4,56 bilhões de anos, e a vida surgiu na sua superfície um bilhão de anos depois.</p>
        </speak>`,
        `<speak>
          <p>A Lua é o único satélite natural da Terra e o quinto maior do Sistema Solar.</p>
          <p>É o maior satélite natural de um planeta no sistema solar em relação ao tamanho do seu corpo primário, tendo 27% do diâmetro e 60% da densidade da Terra, o que representa 1⁄81 da sua massa.</p>
          <p>Entre os satélites cuja densidade é conhecida, a Lua é o segundo mais denso, atrás de Io.</p>
          <p>Estima-se que a formação da Lua tenha ocorrido há cerca de 4,51 mil milhões* de anos, relativamente pouco tempo após a formação da Terra.</p>
        </speak>`,
        `<speak>
          <p>Marte é o quarto planeta a partir do Sol, o segundo menor do Sistema Solar.</p>
          <p>Batizado em homenagem ao deus romano da guerra, muitas vezes é descrito como o "Planeta Vermelho", porque o óxido de ferro predominante em sua superfície lhe dá uma aparência avermelhada.</p>
          <p>Marte é um planeta rochoso com uma atmosfera fina, com características de superfície que lembram tanto as crateras de impacto da Lua quanto vulcões, vales, desertos e calotas polares da Terra.</p>
          <p>O período de rotação e os ciclos sazonais de Marte são também semelhantes aos da Terra, assim como é a inclinação que produz as suas estações do ano.</p>
        </speak>`
      ],
      Indonesian: [
        `<speak>
          <p>Bumi adalah planet ketiga dari Matahari yang merupakan planet terpadat dan terbesar kelima dari delapan planet dalam Tata Surya.</p>
          <p>Bumi juga merupakan planet terbesar dari empat planet kebumian Tata Surya. Bumi terkadang disebut dengan dunia atau Planet Biru.</p>
          <p>Bumi terbentuk sekitar 4,54 miliar tahun yang lalu, dan kehidupan sudah muncul di permukaannya paling tidak sekitar 3,5 miliar tahun yang lalu.</p>
          <p>Biosfer Bumi kemudian secara perlahan mengubah atmosfer dan kondisi fisik dasar lainnya, yang memungkinkan terjadinya perkembangbiakan organisme serta pembentukan lapisan ozon, yang bersama medan magnet Bumi menghalangi radiasi surya berbahaya dan mengizinkan makhluk hidup mikroskopis untuk berkembang biak dengan aman di daratan.</p>
          <p>Sifat fisik, sejarah geologi, dan orbit Bumi memungkinkan kehidupan untuk bisa terus bertahan.</p>
        </speak>`,
        `<speak>
          <p>Bulan adalah satelit alami Bumi satu-satunya dan merupakan satelit terbesar kelima dalam Tata Surya.</p>
          <p>Bulan juga merupakan satelit alami terbesar di Tata Surya menurut ukuran planet yang diorbitnya, dengan diameter 27%, kepadatan 60%, dan massa ​1⁄81 (1.23%) dari Bumi.</p>
          <p>Di antara satelit alami lainnya, Bulan adalah satelit terpadat kedua setelah Io, satelit Yupiter.</p>
          <p>Bulan berada pada rotasi sinkron dengan Bumi, yang selalu memperlihatkan sisi yang sama pada Bumi, dengan sisi dekat ditandai oleh mare vulkanik gelap yang terdapat di antara dataran tinggi kerak yang terang dan kawah tubrukan yang menonjol.</p>
          <p>Bulan adalah benda langit yang paling terang setelah Matahari.</p>
        </speak>`,
        `<speak>
          <p>Mars adalah planet terdekat keempat dari Matahari. Namanya diambil dari dewa perang Romawi, Mars.</p>
          <p>Planet ini sering dijuluki sebagai "planet merah" karena tampak dari jauh berwarna kemerah-kemerahan.</p>
          <p>Ini disebabkan oleh keberadaan besi(III) oksida di permukaan planet Mars. Mars adalah planet bebatuan dengan atmosfer yang tipis. Di permukaan Mars terdapat kawah, gunung berapi, lembah, gurun, dan tudung es.</p>
          <p>Periode rotasi dan siklus musim Mars mirip dengan Bumi. Di Mars berdiri Olympus Mons, gunung tertinggi di Tata Surya, dan Valles Marineris, lembah terbesar di Tata Surya. Selain itu, di belahan utara terdapat cekungan Borealis yang meliputi 40% permukaan Mars.</p>
        </speak>`
      ],
      Chinese: [
        `<speak>
          <p>地球是太阳系中由內及外的第三顆行星，距离太阳约1.5亿公里。地球是宇宙中人類已知唯一存在生命的天体，也是人類居住的星球，共有76.6億人口。</p>
          <p>地球质量约为5.97×1024公斤，半径约6,371公里，地球的密度是太阳系中最高的。地球同时进行自转和公转运动，分别产生了昼夜及四季的变化更替，一太陽日自转一周，一太陽年公转一周。</p>
          <p>自转轨道面称为赤道面，公转轨道面称为黄道面，两者之间的夹角称为黄赤交角。地球仅擁有一顆自然卫星，即月球。</p>
          <p>地球表面有71%的面积被水覆盖，称为海洋或湖或河流，其余是陆地板块組成的大洲和岛屿，表面分布河流和湖泊等水源。</p>
          <p>南极的冰盖及北极存有冰。主體包括岩石圈、地幔、熔融态金属的外地核以及固态金属的內地核。擁有由外地核產生的地磁场。</p>
          <p>外部被氣體包圍，称为大氣層，主要成分為氮、氧、氬。</p>
        </speak>`,
        `<speak>
          <p>月球，俗稱月亮，又稱月，在中國古時又稱太陰、玄兔、嬋娟、望舒，是地球唯一的天然衛星，並且是太陽系中第五大的衛星。月球的直徑略大于地球的四分之一，質量约为地球的1/81，相对于所环绕的行星，它是体积和质量最大的卫星，也是太阳系内密度第二高的卫星，仅次于木卫一。</p>
          <p>一般认为月亮形成于约45亿年前，即地球出现后的不久。</p>
          <p>有关它的起源有几种假说，但沒有一種能完全合理地作毫無破綻的解釋，最被普遍认可的是大碰撞說，它假設月球形成于地球与火星般大小的「忒伊亚」之间的一次巨大撞击。</p>
        </speak>`,
        `<speak>
          <p>火星（拉丁語：Mars, 天文符號♂），是離太陽第四近的行星，為太陽系中四顆類地行星之一。</p>
          <p>西方稱火星為瑪爾斯，是羅馬神話中的戰神；古漢語中則因为它荧荧如火，位置、亮度時常變動讓人無法捉摸而稱之為熒惑。</p>
          <p>火星是太陽系的八大行星中第二小的行星，其質量、體積仅比水星略大。火星的直徑約為地球的一半，自轉軸傾角、自轉週期則與地球相當，但繞太陽公轉周期是地球的兩倍。</p>
          <p>在地球上，火星肉眼可見，亮度可達-2.91，只比金星、月球和太陽暗，但在大部分時間裡比木星暗。</p>
          <p>火星大气以二氧化碳为主，既稀薄又寒冷。火星在視覺上呈現為橘紅色是由其地表所廣泛分佈的氧化鐵造成的。</p>
          <p>火星地表沙丘、砾石遍布且没有稳定的液态水，火星南半球是古老、充满陨石坑的高地，北半球则是较年轻的平原。</p>
        </speak>`
      ],
      Italian: [
        `<speak>
          <p>La Terra è il terzo pianeta in ordine di distanza dal Sole e il più grande dei pianeti terrestri del sistema solare, sia per massa sia per diametro.</p>
          <p>È il luogo primigenio degli esseri umani ed, essendo l'unico corpo planetario del sistema solare adatto a sostenere la vita come da noi concepita e conosciuta, è anche l’unico luogo nel quale vivono tutte le specie viventi conosciute.</p>
          <p>Sulla sua superficie, si trova acqua in tutti e tre gli stati (solido, liquido e gassoso) e un'atmosfera composta in prevalenza da azoto e ossigeno che, insieme al campo magnetico che avvolge il pianeta, protegge la Terra dai raggi cosmici e dalle radiazioni solari.</p>
        </speak>`,
        `<speak>
          <p>La Luna è un satellite naturale, l'unico della Terra.</p>
          <p>Il suo nome proprio viene talvolta utilizzato, per antonomasia e con l'iniziale minuscola («una luna»), come sinonimo di satellite anche per i corpi celesti che orbitano attorno ad altri pianeti.</p>
          <p>Orbita a una distanza media di circa 384 400 km dalla Terra, sufficientemente vicina da essere osservabile a occhio nudo, il che rende possibile distinguerne alcuni rilievi sulla superficie.</p>
          <p>Essendo in rotazione sincrona rivolge sempre la stessa faccia verso la Terra e il suo lato nascosto è rimasto sconosciuto fino al periodo delle esplorazioni spaziali.</p>
        </speak>`,
        `<speak>
          <p>Marte è il quarto pianeta del sistema solare in ordine di distanza dal Sole; è visibile a occhio nudo ed è l'ultimo dei pianeti di tipo terrestre dopo Mercurio, Venere e la Terra.</p>
          <p>Chiamato il Pianeta rosso a causa del suo colore caratteristico causato dalle grandi quantità di ossido di ferro che lo ricoprono, Marte prende il nome dall'omonima divinità della mitologia romana e il suo simbolo astronomico è la rappresentazione stilizzata dello scudo e della lancia del dio.</p>
        </speak>`
      ],
      Korean: [
        `<speak>
          <p>지구(地球, Earth)는 태양으로부터 세 번째 행성이며, 엷은 대기층으로 둘러싸여 있고, 지금까지 발견된 지구형 행성 가운데 가장 크다.</p>
          <p>지구는 45억 6700만 년 전 형성되었으며, 지구와 행성 테이아의 격렬한 충돌로 생성된 달을 위성으로 두고 있다. 지구의 중력은 우주의 다른 물체, 특히 태양과 지구의 유일한 자연위성인 달과 상호작용한다.</p>
          <p>지구와 달 사이의 중력 작용으로 조석 현상이 발생한다.</p>
        </speak>`,
        `<speak>
          <p>달은 지구의 유일한 영구적 자연위성으로, 태양계내의 위성 중 5번째로 크다.</p>
          <p>행성의 크기와 연관하여 자연위성 중 가장 크다. 지구 중심으로부터 달 중심까지의 거리는 평균 38만 4400킬로미터로, 지구 지름의 30배이며, 지구에서 태양까지 거리의 400분의 1이다.</p>
          <p>달의 지름은 지구의 약 4분의 1, 태양의 약 400분의 1인 3500 km이다. 달의 부피는 지구의 약 1/50 정도이며, 표면에서의 중력은 지구의 약 17%이다.</p>
          <p>달은 지구를 약 27.3일에 일주하며(공전 주기), 지구-달-태양의 위치 변화는 29.5일을 주기로 달라지는 달의 상을 만든다(삭망 주기).</p>
        </speak>`,
        `<speak>
          <p>화성은 태양계의 네 번째 행성이다. 4개의 지구형 행성 중 하나다.</p>
          <p>붉은색을 띠기 때문에 동양권에서는 불을 뜻하는 화(火)를 써서 화성 또는 형혹성(熒惑星)이라 부르고, 서양권에서는 로마 신화의 전쟁의 신 마르스의 이름을 따 Mars라 부른다.</p>
          <p>오늘날 영어에서 3월을 뜻하는 March도 여기서 생겼다. 지구와의 거리는 7800만 km이다</p>
          <p>매리너 4호가 1965년에 화성을 처음으로 근접 비행을 하기 전까지 과학계 안팎의 사람들은 화성에 대량의 물이 존재하리라고 기대하였다.</p>
        </speak>`
      ],
      Romanian: [
        `<speak>
          <p>Pământul este a treia planetă de la Soare și cea mai mare dintre planetele telurice ale Sistemului Solar, atât pentru masă, cât și pentru diametru.</p>
          <p>Este singurul corp ceresc despre care se știe că adăpostește viață.</p>
          <p>Conform datărilor radiometrice și a altor surse de dovezi, Pământul s-a format în urmă cu peste 4,5 miliarde de ani.</p>
          <p>Gravitația Pământului interacționează cu alte obiecte din spațiu, în special cu Soarele și Luna, singurul satelit natural al Pământului.</p>
          <p>Terra se învârte în jurul Soarelui în 365,26 de zile, perioadă cunoscută drept un an. În acest timp, Pământul se rotește în jurul axei sale de aproximativ 366,26 ori.</p>
        </speak>`,
        `<speak>
          <p>Luna, este un corp astronomic care orbitează planeta Pământ, fiind singurul său satelit natural permanent⁠.</p>
          <p>Este al cincilea cel mai mare⁠ satelit natural din Sistemul Solar, și cel mai mare dintre sateliți planetari relativ la dimensiunea planetei pe care o orbitează.</p>
          <p>După satelitul lui Jupiter, Io, Luna este al doilea cel mai dens satelit dintre cei ale căror densități sunt cunoscute.</p>
          <p>Se consideră că Luna s-a format acum circa 4,51 miliarde de ani, nu mult după Pământ⁠.</p>
        </speak>`,
        `<speak>
          <p>Marte este, pornind dinspre Soare, a patra planetă a Sistemului Solar, a cărei denumire provine de la Marte, zeul roman al războiului.</p>
          <p>Uneori mai este numită și „planeta roșie” datorită înfățișării sale văzută de pe Pământ. Culoarea roșiatică se explică prin prezența pe suprafața sa a oxidului de fier.</p>
          <p>Marte este o planetă telurică (de tip terestru) cu o atmosferă subțire; printre caracteristicile suprafeței se numără și craterele de impact ce amintesc de Lună, dar și vulcani, văi, deșerturi și calote glaciare polare ce amintesc de Pământ.</p>
        </speak>`
      ],
      Norwegian: [
        `<speak>
          <p>Jorden eller jorda, menneskenes planet, er den tredje planeten i vårt solsystem regnet fra solen.</p>
          <p>Det er den femte største planeten i solsystemet og planeten med størst tetthet, hvilket innebærer at dens gravitasjon kun overgås av Jupiter, Saturn og Neptun.</p>
          <p>Jorden er den største av solsystemets fire steinplaneter, med en diameter noe større enn Venus' og om lag dobbelt så stor som Mars. Jordkloden blir også noen ganger omtalt som Verden, den blå planeten, eller som Tellus («Jord») etter dens ene latinske betegnelse.</p>
          <p>Jorden er det eneste stedet i Universet som man med sikkerhet kan si at det finnes liv.</p>
        </speak>`,
        `<speak>
          <p>Månen er den eneste naturlige satellitten i bane rundt jorden, og den femte største satellitten i solsystemet.</p>
          <p>Sett i forhold til størrelsen på primærlegemet, er månen den største naturlige satellitten tilhørende en planet i solsystemet med en diameter som tilsvarer en fjerdedel av jordens, men bare 1/81 av massen.</p>
          <p>Månen er den nest mest kompakte satellitten etter Io, en av Jupiters måner.</p>
          <p>Den er i en bundet rotasjon med jorden – det vil si at den alltid har den samme siden vendt mot jorden, markert av et mørkt vulkansk hav som fyller området mellom de lyse antikke høylandene og de fremtredende nedslagskratrene.</p>
        </speak>`,
        `<speak>
          <p>Mars er den fjerde planeten fra solen i vårt solsystem og er oppkalt etter den romerske krigsguden Mars.</p>
          <p>Planeten blir ofte beskrevet som den «røde planeten» på grunn av sitt rødlige utseende, forårsaket av jern(III)oksid på overflaten.</p>
          <p>Mars er en steinplanet med en tynn atmosfære. Overflateegenskapene minner om både nedslagskraterne på månen og vulkanene, dalene, ørkenene og de polare iskappene på jorden.</p>
          <p>Rotasjonsperioden og årstidssyklusene på Mars ligner også på jorden siden det er aksehelningen som fører til årstidene. Olympus Mons er det høyeste kjente fjellet i solsystemet, og Valles Marineris er det største dalsystemet.</p>
          <p>Det flate Borealisbassenget på den nordlige halvkulen dekker ca. 40 % av planeten og kan stamme fra et gigantisk nedslag.</p>
        </speak>`
      ],
      Czech: [
        `<speak>
          <p>Země je třetí planeta sluneční soustavy se střední vzdáleností od Slunce asi 1 Au, zároveň největší terestrická planeta v soustavě a jediné planetární těleso, na němž je dle současných vědeckých poznatků potvrzen život.</p>
          <p>Země nejspíše vznikla před 4,6 miliardami let a krátce po svém vzniku získala svůj jediný přirozený satelit – Měsíc.</p>
          <p>Země obíhá kolem Slunce po elipse s velmi malou excentricitou dráhy. Země jako domovský svět lidstva má mnoho názvů v závislosti na národu, mezi nejznámější patří název latinského původu Terra, či řecký název Gaia.</p>
        </speak>`,
        `<speak>
          <p>Měsíc je jediná známá přirozená družice Země.</p>
          <p>Nemá jiné formální jméno než „měsíc“, i když je občas básnicky nazýván Luna (slovanský a zároveň latinský výraz pro Měsíc).</p>
          <p>Kromě slova lunární se podle jména starořecké bohyně Měsíce Seléné používá k odkazu na Měsíc též kmene selene nebo seleno.</p>
          <p>Střední vzdálenost Měsíce od Země je 384 403 km. Měsíční rovníkový průměr je 3 476 km.</p>
        </speak>`,
        `<speak>
          <p>Mars je čtvrtá planeta sluneční soustavy, druhá nejmenší planeta soustavy po Merkuru.</p>
          <p>Byla pojmenována po římském bohu války Martovi. Jedná se o planetu terestrického typu, tj. s pevným horninovým povrchem pokrytým impaktními krátery, vysokými sopkami, hlubokými kaňony a dalšími útvary.</p>
          <p>Má dva měsíce nepravidelného tvaru nazvané Phobos a Deimos.</p>
          <p>V období, kdy je Mars v opozici ke Slunci a Země se tak nachází mezi těmito dvěma tělesy, lze Mars vidět na obloze celou noc.</p>
        </speak>`
      ],
      Greek: [
        `<speak>
          <p>Η Γη αποτελεί τον τρίτο πιο κοντινό πλανήτη στον Ήλιο, τον πιο πυκνό και τον πέμπτο μεγαλύτερο σε μάζα στο Ηλιακό Σύστημα και ειδικότερα τον μεγαλύτερο ανάμεσα στους γήινους πλανήτες, δηλαδή τους πλανήτες με στερεό φλοιό και το μοναδικό γνωστό ουράνιο σώμα που φιλοξενεί ζωή.</p>
          <p>Σύμφωνα με ενδείξεις μέσω ραδιομετρικής χρονολόγησης και άλλων πηγών, η Γη σχηματίστηκε πριν από 4,54 δισεκατομμύρια έτη.</p>
          <p>Αλληλεπιδρά με τα άλλα αντικείμενα του χώρου μέσω βαρυτικών δυνάμεων, ιδιαίτερα με τον Ήλιο και τη Σελήνη, η οποία αποτελεί τον μοναδικό μόνιμο φυσικό δορυφόρο της.</p>
        </speak>`,
        `<speak>
          <p>Η Σελήνη είναι ο μοναδικός φυσικός δορυφόρος της Γης και ο πέμπτος μεγαλύτερος φυσικός δορυφόρος του ηλιακού συστήματος.</p>
          <p>Πήρε το όνομά του από την Σελήνη, αρχαιοελληνική θεά του δορυφόρου αυτού. Λέγεται επίσης και «Φεγγάρι» στη δημοτική γλώσσα.</p>
          <p>Είναι το φωτεινότερο σώμα στην ουράνια σφαίρα μετά τον Ήλιο, επειδή είναι και το κοντινότερο στη Γη ουράνιο σώμα.</p>
          <p>Εξαιτίας αυτής της εγγύτητας, η Σελήνη ασκεί ισχυρή βαρυτική επίδραση στη Γη (παλιρροϊκή αλληλεπίδραση), προκαλώντας φαινόμενα όπως οι παλίρροιες, αλλά και επηρεάζοντας τον άξονα περιστροφής της.</p>
        </speak>`,
        `<speak>
          <p>Ο Άρης είναι ο τέταρτος σε απόσταση από τον Ήλιο πλανήτης του Ηλιακού μας Συστήματος, ο δεύτερος πλησιέστερος στη Γη, και ο έβδομος σε διαστάσεις και μάζα του Ηλιακού Συστήματος (ο δεύτερος μικρότερος μετά τον Ερμή).</p>
          <p>Λέγεται συχνά και «ερυθρός πλανήτης» εξαιτίας του ερυθρού χρώματος που παρουσιάζει οφειλόμενο στο τριοξείδιο του σιδήρου στην επιφάνειά του.</p>
        </speak>`
      ],
      Swedish: [
        `<speak>
          <p>Jorden är den tredje planeten från solen och den största av de så kallade stenplaneterna i solsystemet.</p>
          <p>Jorden är hemvist för alla kända levande varelser, inklusive människan. Dess latinska namn, Tellus eller Terra, används ibland om den, och astronomer betecknar den ibland med symbolen (solkors) eller (riksäpple).</p>
          <p>Jorden har en naturlig satellit kallad månen, eller Luna på latin.</p>
          <p>Med flera miljoner arter är jorden den enda himlakropp där man vet att liv existerar.</p>
        </speak>`,
        `<speak>
          <p>Månen är jordens enda naturliga satellit och den femte största månen i solsystemet.</p>
          <p>Näst efter solen är månen, på grund av sin närhet, det mest klarlysande objektet på stjärnhimlen. Månen gör sig också påmind genom tidvatteneffekter på jorden i form av ebb och flod.</p>
          <p>Med dess framträdande ställning på himlen och de regelbundna månfaserna har månen i alla tider fascinerat människan och lämnat ett stort kulturellt avtryck i den mänskliga historien.</p>
          <p>Månen vänder alltid samma sida mot jorden eftersom den befinner sig i en bunden rotation, och roterar därmed exakt en gång runt sin egen axel för varje varv den rör sig runt jorden.</p>
        </speak>`,
        `<speak>
          <p>Mars är den fjärde planeten från solen och solsystemets näst minsta planet. Den har fått sitt namn efter den romerska krigsguden Mars och kallas ibland för "den röda planeten" på grund av sitt rödaktiga utseende.</p>
          <p>Den röda färgen beror på stora mängder järnoxid (rost) som finns fördelat över ytan och i atmosfären.</p>
          <p>Mars är en av de fyra stenplaneterna och har en tunn atmosfär som till största delen består av koldioxid. Ytan är täckt av kratrar av olika storlekar likt månen, men Mars har precis som jorden även många vulkaner, dalgångar, vidsträckta slätter och iskalotter vid polerna.</p>
        </speak>`
      ],
      Danish: [
        `<speak>
          <p>Jorden er den tredje planet i solsystemet regnet fra Solen og har den største diameter, masse og tæthed af jordplaneterne.</p>
          <p>Jorden benævnes også Verden, (Jord)kloden og Tellus efter en romersk gudinde eller Terra efter dens latinske betegnelse.</p>
          <p>Jorden er et hjemsted for millioner af arter, herunder mennesket. Planeten blev dannet for 4,54 milliarder år siden, og livet fremkom på dens overflade inden for den første milliard år.</p>
          <p>Siden da har Jordens biosfære i betydelig grad ændret atmosfæren og andre abiotiske betingelser på planeten, så aerobiske organismer har kunnet udbrede sig.</p>
        </speak>`,
        `<speak>
          <p>Månen er Jordens eneste måne og den femtestørste naturlige satellit i solsystemet. Dens størrelse i forhold til Jorden gør den til den relativt største måne i solsystemet, som omkredser en planet.</p>
          <p>Man regner med, at Månen er dannet som resultat af et gigantisk sammenstød mellem den unge Jord og en mindre planet kaldet Theia for 4,51 milliarder år siden.</p>
          <p>Den gennemsnitlige afstand mellem centrum af Jorden og af Månen er 384.405 km, hvilket er omkring tredive gange Jordens diameter.</p>
          <p>Månens diameter er 3.474 km, lidt over en fjerdedel af Jordens. Det betyder, at Månens rumfang er omkring 2 procent af Jordens.</p>
        </speak>`,
        `<speak>
          <p>Mars er den fjerde planet i Solsystemet talt fra Solen, og naboplanet til vores egen planet Jorden.</p>
          <p>Som Jorden har Mars en atmosfære, om end denne er ganske tynd og næsten udelukkende består af kuldioxid. Mars kaldes også "den røde planet" på grund af sin karakteristiske farve.</p>
          <p>Mars og Jorden roterer næsten lige hurtigt, så på Mars oplever man et "mars-døgn" (soldøgn eller kun "sol"), der er godt 39 ½ minutter længere end et jorddøgn.</p>
          <p>Mars-året; den tid det tager planeten at fuldføre et kredsløb om Solen, tager 686,9601 jorddøgn, eller 1 år og ca. 10½ måned.</p>
        </speak>`
      ],
      Vietnamese: [
        `<speak>
          <p>Trái Đất là hành tinh thứ ba tính từ Mặt Trời, đồng thời cũng là hành tinh lớn nhất trong các hành tinh đất đá của hệ Mặt Trời xét về bán kính, khối lượng và mật độ vật chất.</p>
          <p>Trái Đất còn được biết tên với các tên gọi "hành tinh xanh" hay "Địa Cầu", là nhà của hàng triệu loài sinh vật, trong đó có con người và cho đến nay đây là nơi duy nhất trong vũ trụ được biết đến là có sự sống.</p>
          <p>Hành tinh này được hình thành cách đây 4,55 tỷ năm và sự sống xuất hiện trên bề mặt của nó khoảng 1 tỷ năm trước.</p>
          <p>Kể từ đó, sinh quyển, bầu khí quyển của Trái Đất và các điều kiện vô cơ khác đã thay đổi đáng kể, tạo điều kiện thuận lợi cho sự phổ biến của các vi sinh vật ưa khí cũng như sự hình thành của tầng ôzôn-lớp bảo vệ quan trọng, cùng với từ trường của Trái Đất, đã ngăn chặn các bức xạ có hại và chở che cho sự sống.</p>
        </speak>`,
        `<speak>
          <p>Mặt Trăng là vệ tinh tự nhiên duy nhất của Trái Đất và là vệ tinh tự nhiên lớn thứ năm trong Hệ Mặt Trời.</p>
          <p>Khoảng cách trung bình tính từ tâm Trái Đất đến Mặt Trăng là 384.403 km, lớn khoảng 30 lần đường kính Trái Đất.</p>
          <p>Đường kính Mặt Trăng là 3.474 km, tức hơn một phần tư đường kính Trái Đất.</p>
          <p>Khối lượng Mặt Trăng khoảng bằng 2% khối lượng Trái Đất và lực hấp dẫn tại bề mặt Mặt Trăng bằng 17% lực hấp dẫn trên bề mặt Trái Đất.</p>
          <p>Mặt Trăng quay một vòng quanh Trái Đất với chu kỳ quỹ đạo 27,32 ngày, và các biến đổi định kỳ trong hình học của hệ Trái Đất – Mặt Trăng – Mặt Trời là nguyên nhân gây ra các pha Mặt Trăng, lặp lại sau mỗi chu kỳ giao hội 29,53 ngày.</p>
        </speak>`,
        `<speak>
          <p>Sao Hỏa còn gọi là: Hỏa tinh, là hành tinh thứ tư tính từ Mặt Trời trong Thái Dương Hệ.</p>
          <p>Nó thường được gọi với tên khác là "Hành tinh Đỏ", do sắt ôxít có mặt rất nhiều trên bề mặt hành tinh làm cho bề mặt nó hiện lên với màu đỏ đặc trưng.</p>
          <p>Sao Hỏa là một hành tinh đất đá với một khí quyển mỏng, có những đặc điểm trên bề mặt có nét giống với cả các hố va chạm trên Mặt Trăng và các núi lửa, thung lũng, sa mạc và chỏm băng ở cực trên của Trái Đất.</p>
          <p>Chu kỳ tự quay và sự tuần hoàn của các mùa trên Hỏa Tinh khá giống với của Trái Đất do độ nghiêng của trục quay tạo ra.</p>
          <p>Trên Sao Hỏa có ngọn núi Olympus Mons, ngọn núi cao nhất trong Hệ Mặt Trời, và hẻm núi Valles Marineris, hẻm núi dài và rộng nhất trong Thái Dương Hệ.</p>
        </speak>`
      ],
      Finnish: [
        `<speak>
          <p>Maa eli maapallo tai Tellus on aurinkokuntamme kolmas planeetta Auringosta lukien.</p>
          <p>Maan keskietäisyys Auringosta on noin 149,6 miljoonaa kilometriä eli noin yksi astronominen yksikkö. Maa on aurinkokuntamme tihein sekä sen viidenneksi suurin planeetta niin läpimitaltaan kuin massaltaankin.</p>
          <p>Maa syntyi noin 4,5 miljardia vuotta sitten. Maa on niin sanottu kiviplaneetta, jolla on metalleista muodostunut ydin, kiviaineksesta muodostunut sula vaippa sekä kiinteä kuori.</p>
          <p>Maalla on myös ilmakehä, ja se on Marsin lisäksi ainoa aurinkokunnan planeetta, jolla esiintyy varmistetusti nestemäistä vettä. Maassa esiintyy runsaasti elämää.</p>
        </speak>`,
        `<speak>
          <p>Kuu on Maan ainoa luonnollinen kiertolainen ja aurinkokunnan viidenneksi suurin kuu.</p>
          <p>Sen säde on 27 prosenttia Maan säteestä, mikä tekee siitä aurinkokunnan suhteessa emoplaneettaansa suurimman kuun.</p>
          <p>Kuun massa on 1,2 prosenttia ja tiheys 61 prosenttia Maan vastaavasta. Se kiertää Maata keskimäärin noin 384 400 kilometrin etäisyydellä.</p>
          <p>Kuu on vuorovesilukkiutunut Maan kanssa. Tämä tarkoittaa, että Kuusta on kääntynyt Maahan päin aina sama puoli, jolloin niin sanottu Kuun pimeä puoli jää aina näkymättömiin.</p>
        </speak>`,
        `<speak>
          <p>Mars on Maan naapuriplaneetta ja aurinkokunnan neljäs planeetta Auringosta laskettuna.</p>
          <p>Planeetta on nimetty roomalaisessa mytologiassa esiintyvän sodanjumala Marsin mukaan.</p>
          <p>Punertavan Marsin läpimitta on noin puolet Maan läpimitasta, ja se on ihmiselle elinkelvoton. Marsissa on höyrynä, nesteenä ja jäänä esiintyvää vettä sekä hyvin ohut kaasukehä, josta suurin osa on hiilidioksidia ja loput pääasiassa typpeä.</p>
          <p>Kaasukehän ohuus johtuu Marsin pienestä painovoimasta. Mars on lisäksi niin kylmä, että sen kaasukehän hiilidioksidi tiivistyy siellä aika ajoin napalakkeihin. Marsilla on myös kaksi pientä kuuta, Phobos ja Deimos.</p>
        </speak>`
      ],
      Turkish: [
        `<speak>
          <p>Dünya; Güneş Sistemi'nde Güneş'e en yakın üçüncü gezegendir. Güneş Sistemi'ndeki en yoğun ve beşinci büyük gezegendir.</p>
          <p>Şu an için üzerinde yaşam olduğu bilinen tek gezegendir.</p>
          <p>Katı ya da 'kaya' ağırlıklı yapısı nedeniyle üyesi bulunduğu yer benzeri gezegenler grubuna adını vermiştir.</p>
          <p>Bu gezegen grubunun kütle ve hacim açısından en büyük üyesidir. Büyüklükte, Güneş Sistemi'nin 8 gezegeni arasında gaz devlerinin büyük farkla arkasından gelerek, beşinci sıraya yerleşir.</p>
          <p>Tek doğal uydusu Ay'dır. Yeryüzü, Yerküre, Mavi Gezegen ya da Latince adıyla Terra olarak da anılır.</p>
        </speak>`,
        `<speak>
          <p>Ay, Dünya'nın tek doğal uydusudur. Güneş Sistemi içinde beşinci büyük doğal uydudur.</p>
          <p>Dünya ile Ay arasında ortalama merkezden merkeze uzaklık 384.403 km, yani Dünya'nın çapının yaklaşık otuz katı kadardır.</p>
          <p>Ay'ın çapı 3.474 km'dir, bu da Dünya çapının dörtte birinden biraz fazladır. Dolayısıyla Ay'ın hacmi Dünya'nın hacminin %2'sidir.</p>
          <p>Kütlesi Dünya kütlesinden 81,3 kat daha düşüktür. Yüzeyinde kütle çekim etkisi yer çekiminin yaklaşık %17'sidir.</p>
          <p>Ay, Dünya'nın yörüngesinde bir turunu 27 gün 7 saatte tamamlar. Dünya, Ay ve Güneş geometrisinde görülen periyodik değişimler sonucunda her 29,5 günde tekrar eden Ay'ın evreleri oluşur.</p>
        </speak>`,
        `<speak>
          <p>Latince Mars veya Arapça Merih, Güneş Sistemi'nin Güneş'ten itibâren dördüncü gezegeni.</p>
          <p>Roma mitolojisindeki savaş tanrısı Mars'a ithâfen adlandırılmıştır. Yüzeyindeki yaygın demiroksitten dolayı kızılımsı bir görünüme sahip olduğu için Kızıl Gezegen de denir.</p>
          <p>İnce bir atmosferi olan Mars gerek Ay'daki gibi meteor kraterlerini, gerekse Dünya'daki gibi volkan, vadi, çöl ve kutup bölgelerini içeren çehresiyle bir yerbenzeri gezegendir.</p>
          <p>Ayrıca dönme periyodu ve mevsim dönemleri Dünya’nınkine çok benzer. 2 adet uydusu bulunmaktadır.</p>
        </speak>`
      ],
      Ukranian: [
        `<speak>
          <p>Земля́ — третя від Сонця планета Сонячної системи, єдина планета, на якій відоме життя, домівка людства.</p>
          <p>Земля належить до планет земної групи і є найбільшою з цих планет у Сонячній системі. Землю іноді називають світом, латинською назвою Терра або грецькою — Гея.</p>
          <p>Земля є об'єктом дослідження значної кількості наук про Землю. Вивчення Землі як небесного тіла належить до царини астрономії, будову і склад Землі вивчає геологія, стан атмосфери — метеорологія, сукупність проявів життя на планеті — біологія.</p>
          <p>Географія дає опис особливостей рельєфу поверхні планети — океанів, морів, озер та річок, материків та островів, гір та долин, а також людські поселення й суспільні утворення: міста й села, держави, економічні райони тощо.</p>
        </speak>`,
        `<speak>
          <p>Мі́сяць — єдиний природний супутник планети Земля.</p>
          <p>Другий за яскравістю об'єкт на земному небосхилі після Сонця і п'ятий за величиною супутник планет Сонячної системи. Станом на 2018 перший і єдиний позаземний об'єкт природного походження, на якому побувала людина.</p>
          <p>Середня відстань між центрами Землі і Місяця — 384 400 км.</p>
        </speak>`,
        `<speak>
          <p>Марс — четверта планета Сонячної системи за відстанню від Сонця й сьома за розміром і масою. Названа на честь Марса — давньоримського бога війни. Іноді Марс називають «червоною планетою» через червонуватий колір поверхні.</p>
          <p>Марс — планета земного типу з розрідженою атмосферою. На Марсі є метеоритні кратери, як на Місяці, вулкани, долини і пустелі, подібні до земних. Тут розташована гора Олімп (22 456 м), найвища відома гора в Сонячній системі, і Долини Марінера — величезна рифтоподібна система каньйонів.</p>
          <p>На додаток до особливостей — період обертання Марса і сезонні цикли також подібні до земних.</p>
        </speak>`
      ]
    };

     // Get the correct SSML based on the language
    const randomIndex = Math.floor(Math.random() * 3);
    const previewSsml = (ssml[voice.language.name]) ? ssml[voice.language.name][randomIndex] : null;

    if (!previewSsml) { throw new Error('Cannot create a voice preview, because there is no SSML for this language.'); }

    if (!['Google', 'AWS'].includes(voice.synthesizer)) { throw new Error('Voice synthesizer not supported.'); }

    if (voice.synthesizer === 'Google') {
      const googleSynthesizer = new GoogleSynthesizer();
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
      localAudiofilePath = await googleSynthesizer.SSMLToSpeech(
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
