module.exports = {
        typeDefs: /* GraphQL */ `type AggregateArticle {
  count: Int!
}

type AggregateAudiofile {
  count: Int!
}

type AggregateSource {
  count: Int!
}

type AggregateTag {
  count: Int!
}

type AggregateUser {
  count: Int!
}

type Article {
  id: ID!
  title: String!
  subtitle: String
  description: String
  url: String!
  imageUrl: String
  readingTime: Float
  language: Language!
  authorName: String
  authorUrl: String
  publicationName: String
  publicationUrl: String
  source: Source!
  sourceArticleId: String!
  html: String!
  ssml: String!
  audiofiles(where: AudiofileWhereInput, orderBy: AudiofileOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Audiofile!]
  tags(where: TagWhereInput, orderBy: TagOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Tag!]
  createdAt: DateTime!
  updatedAt: DateTime!
}

type ArticleConnection {
  pageInfo: PageInfo!
  edges: [ArticleEdge]!
  aggregate: AggregateArticle!
}

input ArticleCreateInput {
  title: String!
  subtitle: String
  description: String
  url: String!
  imageUrl: String
  readingTime: Float
  language: Language!
  authorName: String
  authorUrl: String
  publicationName: String
  publicationUrl: String
  source: SourceCreateOneWithoutArticlesInput!
  sourceArticleId: String!
  html: String!
  ssml: String!
  audiofiles: AudiofileCreateManyWithoutArticleInput
  tags: TagCreateManyInput
}

input ArticleCreateManyWithoutSourceInput {
  create: [ArticleCreateWithoutSourceInput!]
  connect: [ArticleWhereUniqueInput!]
}

input ArticleCreateOneWithoutAudiofilesInput {
  create: ArticleCreateWithoutAudiofilesInput
  connect: ArticleWhereUniqueInput
}

input ArticleCreateWithoutAudiofilesInput {
  title: String!
  subtitle: String
  description: String
  url: String!
  imageUrl: String
  readingTime: Float
  language: Language!
  authorName: String
  authorUrl: String
  publicationName: String
  publicationUrl: String
  source: SourceCreateOneWithoutArticlesInput!
  sourceArticleId: String!
  html: String!
  ssml: String!
  tags: TagCreateManyInput
}

input ArticleCreateWithoutSourceInput {
  title: String!
  subtitle: String
  description: String
  url: String!
  imageUrl: String
  readingTime: Float
  language: Language!
  authorName: String
  authorUrl: String
  publicationName: String
  publicationUrl: String
  sourceArticleId: String!
  html: String!
  ssml: String!
  audiofiles: AudiofileCreateManyWithoutArticleInput
  tags: TagCreateManyInput
}

type ArticleEdge {
  node: Article!
  cursor: String!
}

enum ArticleOrderByInput {
  id_ASC
  id_DESC
  title_ASC
  title_DESC
  subtitle_ASC
  subtitle_DESC
  description_ASC
  description_DESC
  url_ASC
  url_DESC
  imageUrl_ASC
  imageUrl_DESC
  readingTime_ASC
  readingTime_DESC
  language_ASC
  language_DESC
  authorName_ASC
  authorName_DESC
  authorUrl_ASC
  authorUrl_DESC
  publicationName_ASC
  publicationName_DESC
  publicationUrl_ASC
  publicationUrl_DESC
  sourceArticleId_ASC
  sourceArticleId_DESC
  html_ASC
  html_DESC
  ssml_ASC
  ssml_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type ArticlePreviousValues {
  id: ID!
  title: String!
  subtitle: String
  description: String
  url: String!
  imageUrl: String
  readingTime: Float
  language: Language!
  authorName: String
  authorUrl: String
  publicationName: String
  publicationUrl: String
  sourceArticleId: String!
  html: String!
  ssml: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}

input ArticleScalarWhereInput {
  id: ID
  id_not: ID
  id_in: [ID!]
  id_not_in: [ID!]
  id_lt: ID
  id_lte: ID
  id_gt: ID
  id_gte: ID
  id_contains: ID
  id_not_contains: ID
  id_starts_with: ID
  id_not_starts_with: ID
  id_ends_with: ID
  id_not_ends_with: ID
  title: String
  title_not: String
  title_in: [String!]
  title_not_in: [String!]
  title_lt: String
  title_lte: String
  title_gt: String
  title_gte: String
  title_contains: String
  title_not_contains: String
  title_starts_with: String
  title_not_starts_with: String
  title_ends_with: String
  title_not_ends_with: String
  subtitle: String
  subtitle_not: String
  subtitle_in: [String!]
  subtitle_not_in: [String!]
  subtitle_lt: String
  subtitle_lte: String
  subtitle_gt: String
  subtitle_gte: String
  subtitle_contains: String
  subtitle_not_contains: String
  subtitle_starts_with: String
  subtitle_not_starts_with: String
  subtitle_ends_with: String
  subtitle_not_ends_with: String
  description: String
  description_not: String
  description_in: [String!]
  description_not_in: [String!]
  description_lt: String
  description_lte: String
  description_gt: String
  description_gte: String
  description_contains: String
  description_not_contains: String
  description_starts_with: String
  description_not_starts_with: String
  description_ends_with: String
  description_not_ends_with: String
  url: String
  url_not: String
  url_in: [String!]
  url_not_in: [String!]
  url_lt: String
  url_lte: String
  url_gt: String
  url_gte: String
  url_contains: String
  url_not_contains: String
  url_starts_with: String
  url_not_starts_with: String
  url_ends_with: String
  url_not_ends_with: String
  imageUrl: String
  imageUrl_not: String
  imageUrl_in: [String!]
  imageUrl_not_in: [String!]
  imageUrl_lt: String
  imageUrl_lte: String
  imageUrl_gt: String
  imageUrl_gte: String
  imageUrl_contains: String
  imageUrl_not_contains: String
  imageUrl_starts_with: String
  imageUrl_not_starts_with: String
  imageUrl_ends_with: String
  imageUrl_not_ends_with: String
  readingTime: Float
  readingTime_not: Float
  readingTime_in: [Float!]
  readingTime_not_in: [Float!]
  readingTime_lt: Float
  readingTime_lte: Float
  readingTime_gt: Float
  readingTime_gte: Float
  language: Language
  language_not: Language
  language_in: [Language!]
  language_not_in: [Language!]
  authorName: String
  authorName_not: String
  authorName_in: [String!]
  authorName_not_in: [String!]
  authorName_lt: String
  authorName_lte: String
  authorName_gt: String
  authorName_gte: String
  authorName_contains: String
  authorName_not_contains: String
  authorName_starts_with: String
  authorName_not_starts_with: String
  authorName_ends_with: String
  authorName_not_ends_with: String
  authorUrl: String
  authorUrl_not: String
  authorUrl_in: [String!]
  authorUrl_not_in: [String!]
  authorUrl_lt: String
  authorUrl_lte: String
  authorUrl_gt: String
  authorUrl_gte: String
  authorUrl_contains: String
  authorUrl_not_contains: String
  authorUrl_starts_with: String
  authorUrl_not_starts_with: String
  authorUrl_ends_with: String
  authorUrl_not_ends_with: String
  publicationName: String
  publicationName_not: String
  publicationName_in: [String!]
  publicationName_not_in: [String!]
  publicationName_lt: String
  publicationName_lte: String
  publicationName_gt: String
  publicationName_gte: String
  publicationName_contains: String
  publicationName_not_contains: String
  publicationName_starts_with: String
  publicationName_not_starts_with: String
  publicationName_ends_with: String
  publicationName_not_ends_with: String
  publicationUrl: String
  publicationUrl_not: String
  publicationUrl_in: [String!]
  publicationUrl_not_in: [String!]
  publicationUrl_lt: String
  publicationUrl_lte: String
  publicationUrl_gt: String
  publicationUrl_gte: String
  publicationUrl_contains: String
  publicationUrl_not_contains: String
  publicationUrl_starts_with: String
  publicationUrl_not_starts_with: String
  publicationUrl_ends_with: String
  publicationUrl_not_ends_with: String
  sourceArticleId: String
  sourceArticleId_not: String
  sourceArticleId_in: [String!]
  sourceArticleId_not_in: [String!]
  sourceArticleId_lt: String
  sourceArticleId_lte: String
  sourceArticleId_gt: String
  sourceArticleId_gte: String
  sourceArticleId_contains: String
  sourceArticleId_not_contains: String
  sourceArticleId_starts_with: String
  sourceArticleId_not_starts_with: String
  sourceArticleId_ends_with: String
  sourceArticleId_not_ends_with: String
  html: String
  html_not: String
  html_in: [String!]
  html_not_in: [String!]
  html_lt: String
  html_lte: String
  html_gt: String
  html_gte: String
  html_contains: String
  html_not_contains: String
  html_starts_with: String
  html_not_starts_with: String
  html_ends_with: String
  html_not_ends_with: String
  ssml: String
  ssml_not: String
  ssml_in: [String!]
  ssml_not_in: [String!]
  ssml_lt: String
  ssml_lte: String
  ssml_gt: String
  ssml_gte: String
  ssml_contains: String
  ssml_not_contains: String
  ssml_starts_with: String
  ssml_not_starts_with: String
  ssml_ends_with: String
  ssml_not_ends_with: String
  createdAt: DateTime
  createdAt_not: DateTime
  createdAt_in: [DateTime!]
  createdAt_not_in: [DateTime!]
  createdAt_lt: DateTime
  createdAt_lte: DateTime
  createdAt_gt: DateTime
  createdAt_gte: DateTime
  updatedAt: DateTime
  updatedAt_not: DateTime
  updatedAt_in: [DateTime!]
  updatedAt_not_in: [DateTime!]
  updatedAt_lt: DateTime
  updatedAt_lte: DateTime
  updatedAt_gt: DateTime
  updatedAt_gte: DateTime
  AND: [ArticleScalarWhereInput!]
  OR: [ArticleScalarWhereInput!]
  NOT: [ArticleScalarWhereInput!]
}

type ArticleSubscriptionPayload {
  mutation: MutationType!
  node: Article
  updatedFields: [String!]
  previousValues: ArticlePreviousValues
}

input ArticleSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: ArticleWhereInput
  AND: [ArticleSubscriptionWhereInput!]
  OR: [ArticleSubscriptionWhereInput!]
  NOT: [ArticleSubscriptionWhereInput!]
}

input ArticleUpdateInput {
  title: String
  subtitle: String
  description: String
  url: String
  imageUrl: String
  readingTime: Float
  language: Language
  authorName: String
  authorUrl: String
  publicationName: String
  publicationUrl: String
  source: SourceUpdateOneRequiredWithoutArticlesInput
  sourceArticleId: String
  html: String
  ssml: String
  audiofiles: AudiofileUpdateManyWithoutArticleInput
  tags: TagUpdateManyInput
}

input ArticleUpdateManyDataInput {
  title: String
  subtitle: String
  description: String
  url: String
  imageUrl: String
  readingTime: Float
  language: Language
  authorName: String
  authorUrl: String
  publicationName: String
  publicationUrl: String
  sourceArticleId: String
  html: String
  ssml: String
}

input ArticleUpdateManyMutationInput {
  title: String
  subtitle: String
  description: String
  url: String
  imageUrl: String
  readingTime: Float
  language: Language
  authorName: String
  authorUrl: String
  publicationName: String
  publicationUrl: String
  sourceArticleId: String
  html: String
  ssml: String
}

input ArticleUpdateManyWithoutSourceInput {
  create: [ArticleCreateWithoutSourceInput!]
  delete: [ArticleWhereUniqueInput!]
  connect: [ArticleWhereUniqueInput!]
  disconnect: [ArticleWhereUniqueInput!]
  update: [ArticleUpdateWithWhereUniqueWithoutSourceInput!]
  upsert: [ArticleUpsertWithWhereUniqueWithoutSourceInput!]
  deleteMany: [ArticleScalarWhereInput!]
  updateMany: [ArticleUpdateManyWithWhereNestedInput!]
}

input ArticleUpdateManyWithWhereNestedInput {
  where: ArticleScalarWhereInput!
  data: ArticleUpdateManyDataInput!
}

input ArticleUpdateOneRequiredWithoutAudiofilesInput {
  create: ArticleCreateWithoutAudiofilesInput
  update: ArticleUpdateWithoutAudiofilesDataInput
  upsert: ArticleUpsertWithoutAudiofilesInput
  connect: ArticleWhereUniqueInput
}

input ArticleUpdateWithoutAudiofilesDataInput {
  title: String
  subtitle: String
  description: String
  url: String
  imageUrl: String
  readingTime: Float
  language: Language
  authorName: String
  authorUrl: String
  publicationName: String
  publicationUrl: String
  source: SourceUpdateOneRequiredWithoutArticlesInput
  sourceArticleId: String
  html: String
  ssml: String
  tags: TagUpdateManyInput
}

input ArticleUpdateWithoutSourceDataInput {
  title: String
  subtitle: String
  description: String
  url: String
  imageUrl: String
  readingTime: Float
  language: Language
  authorName: String
  authorUrl: String
  publicationName: String
  publicationUrl: String
  sourceArticleId: String
  html: String
  ssml: String
  audiofiles: AudiofileUpdateManyWithoutArticleInput
  tags: TagUpdateManyInput
}

input ArticleUpdateWithWhereUniqueWithoutSourceInput {
  where: ArticleWhereUniqueInput!
  data: ArticleUpdateWithoutSourceDataInput!
}

input ArticleUpsertWithoutAudiofilesInput {
  update: ArticleUpdateWithoutAudiofilesDataInput!
  create: ArticleCreateWithoutAudiofilesInput!
}

input ArticleUpsertWithWhereUniqueWithoutSourceInput {
  where: ArticleWhereUniqueInput!
  update: ArticleUpdateWithoutSourceDataInput!
  create: ArticleCreateWithoutSourceInput!
}

input ArticleWhereInput {
  id: ID
  id_not: ID
  id_in: [ID!]
  id_not_in: [ID!]
  id_lt: ID
  id_lte: ID
  id_gt: ID
  id_gte: ID
  id_contains: ID
  id_not_contains: ID
  id_starts_with: ID
  id_not_starts_with: ID
  id_ends_with: ID
  id_not_ends_with: ID
  title: String
  title_not: String
  title_in: [String!]
  title_not_in: [String!]
  title_lt: String
  title_lte: String
  title_gt: String
  title_gte: String
  title_contains: String
  title_not_contains: String
  title_starts_with: String
  title_not_starts_with: String
  title_ends_with: String
  title_not_ends_with: String
  subtitle: String
  subtitle_not: String
  subtitle_in: [String!]
  subtitle_not_in: [String!]
  subtitle_lt: String
  subtitle_lte: String
  subtitle_gt: String
  subtitle_gte: String
  subtitle_contains: String
  subtitle_not_contains: String
  subtitle_starts_with: String
  subtitle_not_starts_with: String
  subtitle_ends_with: String
  subtitle_not_ends_with: String
  description: String
  description_not: String
  description_in: [String!]
  description_not_in: [String!]
  description_lt: String
  description_lte: String
  description_gt: String
  description_gte: String
  description_contains: String
  description_not_contains: String
  description_starts_with: String
  description_not_starts_with: String
  description_ends_with: String
  description_not_ends_with: String
  url: String
  url_not: String
  url_in: [String!]
  url_not_in: [String!]
  url_lt: String
  url_lte: String
  url_gt: String
  url_gte: String
  url_contains: String
  url_not_contains: String
  url_starts_with: String
  url_not_starts_with: String
  url_ends_with: String
  url_not_ends_with: String
  imageUrl: String
  imageUrl_not: String
  imageUrl_in: [String!]
  imageUrl_not_in: [String!]
  imageUrl_lt: String
  imageUrl_lte: String
  imageUrl_gt: String
  imageUrl_gte: String
  imageUrl_contains: String
  imageUrl_not_contains: String
  imageUrl_starts_with: String
  imageUrl_not_starts_with: String
  imageUrl_ends_with: String
  imageUrl_not_ends_with: String
  readingTime: Float
  readingTime_not: Float
  readingTime_in: [Float!]
  readingTime_not_in: [Float!]
  readingTime_lt: Float
  readingTime_lte: Float
  readingTime_gt: Float
  readingTime_gte: Float
  language: Language
  language_not: Language
  language_in: [Language!]
  language_not_in: [Language!]
  authorName: String
  authorName_not: String
  authorName_in: [String!]
  authorName_not_in: [String!]
  authorName_lt: String
  authorName_lte: String
  authorName_gt: String
  authorName_gte: String
  authorName_contains: String
  authorName_not_contains: String
  authorName_starts_with: String
  authorName_not_starts_with: String
  authorName_ends_with: String
  authorName_not_ends_with: String
  authorUrl: String
  authorUrl_not: String
  authorUrl_in: [String!]
  authorUrl_not_in: [String!]
  authorUrl_lt: String
  authorUrl_lte: String
  authorUrl_gt: String
  authorUrl_gte: String
  authorUrl_contains: String
  authorUrl_not_contains: String
  authorUrl_starts_with: String
  authorUrl_not_starts_with: String
  authorUrl_ends_with: String
  authorUrl_not_ends_with: String
  publicationName: String
  publicationName_not: String
  publicationName_in: [String!]
  publicationName_not_in: [String!]
  publicationName_lt: String
  publicationName_lte: String
  publicationName_gt: String
  publicationName_gte: String
  publicationName_contains: String
  publicationName_not_contains: String
  publicationName_starts_with: String
  publicationName_not_starts_with: String
  publicationName_ends_with: String
  publicationName_not_ends_with: String
  publicationUrl: String
  publicationUrl_not: String
  publicationUrl_in: [String!]
  publicationUrl_not_in: [String!]
  publicationUrl_lt: String
  publicationUrl_lte: String
  publicationUrl_gt: String
  publicationUrl_gte: String
  publicationUrl_contains: String
  publicationUrl_not_contains: String
  publicationUrl_starts_with: String
  publicationUrl_not_starts_with: String
  publicationUrl_ends_with: String
  publicationUrl_not_ends_with: String
  source: SourceWhereInput
  sourceArticleId: String
  sourceArticleId_not: String
  sourceArticleId_in: [String!]
  sourceArticleId_not_in: [String!]
  sourceArticleId_lt: String
  sourceArticleId_lte: String
  sourceArticleId_gt: String
  sourceArticleId_gte: String
  sourceArticleId_contains: String
  sourceArticleId_not_contains: String
  sourceArticleId_starts_with: String
  sourceArticleId_not_starts_with: String
  sourceArticleId_ends_with: String
  sourceArticleId_not_ends_with: String
  html: String
  html_not: String
  html_in: [String!]
  html_not_in: [String!]
  html_lt: String
  html_lte: String
  html_gt: String
  html_gte: String
  html_contains: String
  html_not_contains: String
  html_starts_with: String
  html_not_starts_with: String
  html_ends_with: String
  html_not_ends_with: String
  ssml: String
  ssml_not: String
  ssml_in: [String!]
  ssml_not_in: [String!]
  ssml_lt: String
  ssml_lte: String
  ssml_gt: String
  ssml_gte: String
  ssml_contains: String
  ssml_not_contains: String
  ssml_starts_with: String
  ssml_not_starts_with: String
  ssml_ends_with: String
  ssml_not_ends_with: String
  audiofiles_every: AudiofileWhereInput
  audiofiles_some: AudiofileWhereInput
  audiofiles_none: AudiofileWhereInput
  tags_every: TagWhereInput
  tags_some: TagWhereInput
  tags_none: TagWhereInput
  createdAt: DateTime
  createdAt_not: DateTime
  createdAt_in: [DateTime!]
  createdAt_not_in: [DateTime!]
  createdAt_lt: DateTime
  createdAt_lte: DateTime
  createdAt_gt: DateTime
  createdAt_gte: DateTime
  updatedAt: DateTime
  updatedAt_not: DateTime
  updatedAt_in: [DateTime!]
  updatedAt_not_in: [DateTime!]
  updatedAt_lt: DateTime
  updatedAt_lte: DateTime
  updatedAt_gt: DateTime
  updatedAt_gte: DateTime
  AND: [ArticleWhereInput!]
  OR: [ArticleWhereInput!]
  NOT: [ArticleWhereInput!]
}

input ArticleWhereUniqueInput {
  id: ID
  url: String
}

type Audiofile {
  id: ID!
  url: String!
  article: Article!
  length: Float!
  language: Language!
  voice: String!
  synthesizer: Synthesizer!
  listens: Int
  createdAt: DateTime!
  updatedAt: DateTime!
}

type AudiofileConnection {
  pageInfo: PageInfo!
  edges: [AudiofileEdge]!
  aggregate: AggregateAudiofile!
}

input AudiofileCreateInput {
  url: String!
  article: ArticleCreateOneWithoutAudiofilesInput!
  length: Float!
  language: Language!
  voice: String!
  synthesizer: Synthesizer!
  listens: Int
}

input AudiofileCreateManyWithoutArticleInput {
  create: [AudiofileCreateWithoutArticleInput!]
  connect: [AudiofileWhereUniqueInput!]
}

input AudiofileCreateWithoutArticleInput {
  url: String!
  length: Float!
  language: Language!
  voice: String!
  synthesizer: Synthesizer!
  listens: Int
}

type AudiofileEdge {
  node: Audiofile!
  cursor: String!
}

enum AudiofileOrderByInput {
  id_ASC
  id_DESC
  url_ASC
  url_DESC
  length_ASC
  length_DESC
  language_ASC
  language_DESC
  voice_ASC
  voice_DESC
  synthesizer_ASC
  synthesizer_DESC
  listens_ASC
  listens_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type AudiofilePreviousValues {
  id: ID!
  url: String!
  length: Float!
  language: Language!
  voice: String!
  synthesizer: Synthesizer!
  listens: Int
  createdAt: DateTime!
  updatedAt: DateTime!
}

input AudiofileScalarWhereInput {
  id: ID
  id_not: ID
  id_in: [ID!]
  id_not_in: [ID!]
  id_lt: ID
  id_lte: ID
  id_gt: ID
  id_gte: ID
  id_contains: ID
  id_not_contains: ID
  id_starts_with: ID
  id_not_starts_with: ID
  id_ends_with: ID
  id_not_ends_with: ID
  url: String
  url_not: String
  url_in: [String!]
  url_not_in: [String!]
  url_lt: String
  url_lte: String
  url_gt: String
  url_gte: String
  url_contains: String
  url_not_contains: String
  url_starts_with: String
  url_not_starts_with: String
  url_ends_with: String
  url_not_ends_with: String
  length: Float
  length_not: Float
  length_in: [Float!]
  length_not_in: [Float!]
  length_lt: Float
  length_lte: Float
  length_gt: Float
  length_gte: Float
  language: Language
  language_not: Language
  language_in: [Language!]
  language_not_in: [Language!]
  voice: String
  voice_not: String
  voice_in: [String!]
  voice_not_in: [String!]
  voice_lt: String
  voice_lte: String
  voice_gt: String
  voice_gte: String
  voice_contains: String
  voice_not_contains: String
  voice_starts_with: String
  voice_not_starts_with: String
  voice_ends_with: String
  voice_not_ends_with: String
  synthesizer: Synthesizer
  synthesizer_not: Synthesizer
  synthesizer_in: [Synthesizer!]
  synthesizer_not_in: [Synthesizer!]
  listens: Int
  listens_not: Int
  listens_in: [Int!]
  listens_not_in: [Int!]
  listens_lt: Int
  listens_lte: Int
  listens_gt: Int
  listens_gte: Int
  createdAt: DateTime
  createdAt_not: DateTime
  createdAt_in: [DateTime!]
  createdAt_not_in: [DateTime!]
  createdAt_lt: DateTime
  createdAt_lte: DateTime
  createdAt_gt: DateTime
  createdAt_gte: DateTime
  updatedAt: DateTime
  updatedAt_not: DateTime
  updatedAt_in: [DateTime!]
  updatedAt_not_in: [DateTime!]
  updatedAt_lt: DateTime
  updatedAt_lte: DateTime
  updatedAt_gt: DateTime
  updatedAt_gte: DateTime
  AND: [AudiofileScalarWhereInput!]
  OR: [AudiofileScalarWhereInput!]
  NOT: [AudiofileScalarWhereInput!]
}

type AudiofileSubscriptionPayload {
  mutation: MutationType!
  node: Audiofile
  updatedFields: [String!]
  previousValues: AudiofilePreviousValues
}

input AudiofileSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: AudiofileWhereInput
  AND: [AudiofileSubscriptionWhereInput!]
  OR: [AudiofileSubscriptionWhereInput!]
  NOT: [AudiofileSubscriptionWhereInput!]
}

input AudiofileUpdateInput {
  url: String
  article: ArticleUpdateOneRequiredWithoutAudiofilesInput
  length: Float
  language: Language
  voice: String
  synthesizer: Synthesizer
  listens: Int
}

input AudiofileUpdateManyDataInput {
  url: String
  length: Float
  language: Language
  voice: String
  synthesizer: Synthesizer
  listens: Int
}

input AudiofileUpdateManyMutationInput {
  url: String
  length: Float
  language: Language
  voice: String
  synthesizer: Synthesizer
  listens: Int
}

input AudiofileUpdateManyWithoutArticleInput {
  create: [AudiofileCreateWithoutArticleInput!]
  delete: [AudiofileWhereUniqueInput!]
  connect: [AudiofileWhereUniqueInput!]
  disconnect: [AudiofileWhereUniqueInput!]
  update: [AudiofileUpdateWithWhereUniqueWithoutArticleInput!]
  upsert: [AudiofileUpsertWithWhereUniqueWithoutArticleInput!]
  deleteMany: [AudiofileScalarWhereInput!]
  updateMany: [AudiofileUpdateManyWithWhereNestedInput!]
}

input AudiofileUpdateManyWithWhereNestedInput {
  where: AudiofileScalarWhereInput!
  data: AudiofileUpdateManyDataInput!
}

input AudiofileUpdateWithoutArticleDataInput {
  url: String
  length: Float
  language: Language
  voice: String
  synthesizer: Synthesizer
  listens: Int
}

input AudiofileUpdateWithWhereUniqueWithoutArticleInput {
  where: AudiofileWhereUniqueInput!
  data: AudiofileUpdateWithoutArticleDataInput!
}

input AudiofileUpsertWithWhereUniqueWithoutArticleInput {
  where: AudiofileWhereUniqueInput!
  update: AudiofileUpdateWithoutArticleDataInput!
  create: AudiofileCreateWithoutArticleInput!
}

input AudiofileWhereInput {
  id: ID
  id_not: ID
  id_in: [ID!]
  id_not_in: [ID!]
  id_lt: ID
  id_lte: ID
  id_gt: ID
  id_gte: ID
  id_contains: ID
  id_not_contains: ID
  id_starts_with: ID
  id_not_starts_with: ID
  id_ends_with: ID
  id_not_ends_with: ID
  url: String
  url_not: String
  url_in: [String!]
  url_not_in: [String!]
  url_lt: String
  url_lte: String
  url_gt: String
  url_gte: String
  url_contains: String
  url_not_contains: String
  url_starts_with: String
  url_not_starts_with: String
  url_ends_with: String
  url_not_ends_with: String
  article: ArticleWhereInput
  length: Float
  length_not: Float
  length_in: [Float!]
  length_not_in: [Float!]
  length_lt: Float
  length_lte: Float
  length_gt: Float
  length_gte: Float
  language: Language
  language_not: Language
  language_in: [Language!]
  language_not_in: [Language!]
  voice: String
  voice_not: String
  voice_in: [String!]
  voice_not_in: [String!]
  voice_lt: String
  voice_lte: String
  voice_gt: String
  voice_gte: String
  voice_contains: String
  voice_not_contains: String
  voice_starts_with: String
  voice_not_starts_with: String
  voice_ends_with: String
  voice_not_ends_with: String
  synthesizer: Synthesizer
  synthesizer_not: Synthesizer
  synthesizer_in: [Synthesizer!]
  synthesizer_not_in: [Synthesizer!]
  listens: Int
  listens_not: Int
  listens_in: [Int!]
  listens_not_in: [Int!]
  listens_lt: Int
  listens_lte: Int
  listens_gt: Int
  listens_gte: Int
  createdAt: DateTime
  createdAt_not: DateTime
  createdAt_in: [DateTime!]
  createdAt_not_in: [DateTime!]
  createdAt_lt: DateTime
  createdAt_lte: DateTime
  createdAt_gt: DateTime
  createdAt_gte: DateTime
  updatedAt: DateTime
  updatedAt_not: DateTime
  updatedAt_in: [DateTime!]
  updatedAt_not_in: [DateTime!]
  updatedAt_lt: DateTime
  updatedAt_lte: DateTime
  updatedAt_gt: DateTime
  updatedAt_gte: DateTime
  AND: [AudiofileWhereInput!]
  OR: [AudiofileWhereInput!]
  NOT: [AudiofileWhereInput!]
}

input AudiofileWhereUniqueInput {
  id: ID
  url: String
}

type BatchPayload {
  count: Long!
}

scalar DateTime

enum Language {
  EN
  DE
  NL
}

scalar Long

type Mutation {
  createArticle(data: ArticleCreateInput!): Article!
  updateArticle(data: ArticleUpdateInput!, where: ArticleWhereUniqueInput!): Article
  updateManyArticles(data: ArticleUpdateManyMutationInput!, where: ArticleWhereInput): BatchPayload!
  upsertArticle(where: ArticleWhereUniqueInput!, create: ArticleCreateInput!, update: ArticleUpdateInput!): Article!
  deleteArticle(where: ArticleWhereUniqueInput!): Article
  deleteManyArticles(where: ArticleWhereInput): BatchPayload!
  createAudiofile(data: AudiofileCreateInput!): Audiofile!
  updateAudiofile(data: AudiofileUpdateInput!, where: AudiofileWhereUniqueInput!): Audiofile
  updateManyAudiofiles(data: AudiofileUpdateManyMutationInput!, where: AudiofileWhereInput): BatchPayload!
  upsertAudiofile(where: AudiofileWhereUniqueInput!, create: AudiofileCreateInput!, update: AudiofileUpdateInput!): Audiofile!
  deleteAudiofile(where: AudiofileWhereUniqueInput!): Audiofile
  deleteManyAudiofiles(where: AudiofileWhereInput): BatchPayload!
  createSource(data: SourceCreateInput!): Source!
  updateSource(data: SourceUpdateInput!, where: SourceWhereUniqueInput!): Source
  updateManySources(data: SourceUpdateManyMutationInput!, where: SourceWhereInput): BatchPayload!
  upsertSource(where: SourceWhereUniqueInput!, create: SourceCreateInput!, update: SourceUpdateInput!): Source!
  deleteSource(where: SourceWhereUniqueInput!): Source
  deleteManySources(where: SourceWhereInput): BatchPayload!
  createTag(data: TagCreateInput!): Tag!
  updateTag(data: TagUpdateInput!, where: TagWhereUniqueInput!): Tag
  updateManyTags(data: TagUpdateManyMutationInput!, where: TagWhereInput): BatchPayload!
  upsertTag(where: TagWhereUniqueInput!, create: TagCreateInput!, update: TagUpdateInput!): Tag!
  deleteTag(where: TagWhereUniqueInput!): Tag
  deleteManyTags(where: TagWhereInput): BatchPayload!
  createUser(data: UserCreateInput!): User!
  updateUser(data: UserUpdateInput!, where: UserWhereUniqueInput!): User
  updateManyUsers(data: UserUpdateManyMutationInput!, where: UserWhereInput): BatchPayload!
  upsertUser(where: UserWhereUniqueInput!, create: UserCreateInput!, update: UserUpdateInput!): User!
  deleteUser(where: UserWhereUniqueInput!): User
  deleteManyUsers(where: UserWhereInput): BatchPayload!
}

enum MutationType {
  CREATED
  UPDATED
  DELETED
}

interface Node {
  id: ID!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type Query {
  article(where: ArticleWhereUniqueInput!): Article
  articles(where: ArticleWhereInput, orderBy: ArticleOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Article]!
  articlesConnection(where: ArticleWhereInput, orderBy: ArticleOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): ArticleConnection!
  audiofile(where: AudiofileWhereUniqueInput!): Audiofile
  audiofiles(where: AudiofileWhereInput, orderBy: AudiofileOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Audiofile]!
  audiofilesConnection(where: AudiofileWhereInput, orderBy: AudiofileOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): AudiofileConnection!
  source(where: SourceWhereUniqueInput!): Source
  sources(where: SourceWhereInput, orderBy: SourceOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Source]!
  sourcesConnection(where: SourceWhereInput, orderBy: SourceOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): SourceConnection!
  tag(where: TagWhereUniqueInput!): Tag
  tags(where: TagWhereInput, orderBy: TagOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Tag]!
  tagsConnection(where: TagWhereInput, orderBy: TagOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): TagConnection!
  user(where: UserWhereUniqueInput!): User
  users(where: UserWhereInput, orderBy: UserOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [User]!
  usersConnection(where: UserWhereInput, orderBy: UserOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): UserConnection!
  node(id: ID!): Node
}

type Source {
  id: ID!
  name: String!
  description: String
  url: String!
  articles(where: ArticleWhereInput, orderBy: ArticleOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Article!]
  createdAt: DateTime!
  updatedAt: DateTime!
}

type SourceConnection {
  pageInfo: PageInfo!
  edges: [SourceEdge]!
  aggregate: AggregateSource!
}

input SourceCreateInput {
  name: String!
  description: String
  url: String!
  articles: ArticleCreateManyWithoutSourceInput
}

input SourceCreateOneWithoutArticlesInput {
  create: SourceCreateWithoutArticlesInput
  connect: SourceWhereUniqueInput
}

input SourceCreateWithoutArticlesInput {
  name: String!
  description: String
  url: String!
}

type SourceEdge {
  node: Source!
  cursor: String!
}

enum SourceOrderByInput {
  id_ASC
  id_DESC
  name_ASC
  name_DESC
  description_ASC
  description_DESC
  url_ASC
  url_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type SourcePreviousValues {
  id: ID!
  name: String!
  description: String
  url: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type SourceSubscriptionPayload {
  mutation: MutationType!
  node: Source
  updatedFields: [String!]
  previousValues: SourcePreviousValues
}

input SourceSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: SourceWhereInput
  AND: [SourceSubscriptionWhereInput!]
  OR: [SourceSubscriptionWhereInput!]
  NOT: [SourceSubscriptionWhereInput!]
}

input SourceUpdateInput {
  name: String
  description: String
  url: String
  articles: ArticleUpdateManyWithoutSourceInput
}

input SourceUpdateManyMutationInput {
  name: String
  description: String
  url: String
}

input SourceUpdateOneRequiredWithoutArticlesInput {
  create: SourceCreateWithoutArticlesInput
  update: SourceUpdateWithoutArticlesDataInput
  upsert: SourceUpsertWithoutArticlesInput
  connect: SourceWhereUniqueInput
}

input SourceUpdateWithoutArticlesDataInput {
  name: String
  description: String
  url: String
}

input SourceUpsertWithoutArticlesInput {
  update: SourceUpdateWithoutArticlesDataInput!
  create: SourceCreateWithoutArticlesInput!
}

input SourceWhereInput {
  id: ID
  id_not: ID
  id_in: [ID!]
  id_not_in: [ID!]
  id_lt: ID
  id_lte: ID
  id_gt: ID
  id_gte: ID
  id_contains: ID
  id_not_contains: ID
  id_starts_with: ID
  id_not_starts_with: ID
  id_ends_with: ID
  id_not_ends_with: ID
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  description: String
  description_not: String
  description_in: [String!]
  description_not_in: [String!]
  description_lt: String
  description_lte: String
  description_gt: String
  description_gte: String
  description_contains: String
  description_not_contains: String
  description_starts_with: String
  description_not_starts_with: String
  description_ends_with: String
  description_not_ends_with: String
  url: String
  url_not: String
  url_in: [String!]
  url_not_in: [String!]
  url_lt: String
  url_lte: String
  url_gt: String
  url_gte: String
  url_contains: String
  url_not_contains: String
  url_starts_with: String
  url_not_starts_with: String
  url_ends_with: String
  url_not_ends_with: String
  articles_every: ArticleWhereInput
  articles_some: ArticleWhereInput
  articles_none: ArticleWhereInput
  createdAt: DateTime
  createdAt_not: DateTime
  createdAt_in: [DateTime!]
  createdAt_not_in: [DateTime!]
  createdAt_lt: DateTime
  createdAt_lte: DateTime
  createdAt_gt: DateTime
  createdAt_gte: DateTime
  updatedAt: DateTime
  updatedAt_not: DateTime
  updatedAt_in: [DateTime!]
  updatedAt_not_in: [DateTime!]
  updatedAt_lt: DateTime
  updatedAt_lte: DateTime
  updatedAt_gt: DateTime
  updatedAt_gte: DateTime
  AND: [SourceWhereInput!]
  OR: [SourceWhereInput!]
  NOT: [SourceWhereInput!]
}

input SourceWhereUniqueInput {
  id: ID
  name: String
  url: String
}

type Subscription {
  article(where: ArticleSubscriptionWhereInput): ArticleSubscriptionPayload
  audiofile(where: AudiofileSubscriptionWhereInput): AudiofileSubscriptionPayload
  source(where: SourceSubscriptionWhereInput): SourceSubscriptionPayload
  tag(where: TagSubscriptionWhereInput): TagSubscriptionPayload
  user(where: UserSubscriptionWhereInput): UserSubscriptionPayload
}

enum Synthesizer {
  GOOGLE
  AWS
}

type Tag {
  slug: String!
  name: String!
}

type TagConnection {
  pageInfo: PageInfo!
  edges: [TagEdge]!
  aggregate: AggregateTag!
}

input TagCreateInput {
  slug: String!
  name: String!
}

input TagCreateManyInput {
  create: [TagCreateInput!]
  connect: [TagWhereUniqueInput!]
}

type TagEdge {
  node: Tag!
  cursor: String!
}

enum TagOrderByInput {
  slug_ASC
  slug_DESC
  name_ASC
  name_DESC
  id_ASC
  id_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type TagPreviousValues {
  slug: String!
  name: String!
}

input TagScalarWhereInput {
  slug: String
  slug_not: String
  slug_in: [String!]
  slug_not_in: [String!]
  slug_lt: String
  slug_lte: String
  slug_gt: String
  slug_gte: String
  slug_contains: String
  slug_not_contains: String
  slug_starts_with: String
  slug_not_starts_with: String
  slug_ends_with: String
  slug_not_ends_with: String
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  AND: [TagScalarWhereInput!]
  OR: [TagScalarWhereInput!]
  NOT: [TagScalarWhereInput!]
}

type TagSubscriptionPayload {
  mutation: MutationType!
  node: Tag
  updatedFields: [String!]
  previousValues: TagPreviousValues
}

input TagSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: TagWhereInput
  AND: [TagSubscriptionWhereInput!]
  OR: [TagSubscriptionWhereInput!]
  NOT: [TagSubscriptionWhereInput!]
}

input TagUpdateDataInput {
  slug: String
  name: String
}

input TagUpdateInput {
  slug: String
  name: String
}

input TagUpdateManyDataInput {
  slug: String
  name: String
}

input TagUpdateManyInput {
  create: [TagCreateInput!]
  update: [TagUpdateWithWhereUniqueNestedInput!]
  upsert: [TagUpsertWithWhereUniqueNestedInput!]
  delete: [TagWhereUniqueInput!]
  connect: [TagWhereUniqueInput!]
  disconnect: [TagWhereUniqueInput!]
  deleteMany: [TagScalarWhereInput!]
  updateMany: [TagUpdateManyWithWhereNestedInput!]
}

input TagUpdateManyMutationInput {
  slug: String
  name: String
}

input TagUpdateManyWithWhereNestedInput {
  where: TagScalarWhereInput!
  data: TagUpdateManyDataInput!
}

input TagUpdateWithWhereUniqueNestedInput {
  where: TagWhereUniqueInput!
  data: TagUpdateDataInput!
}

input TagUpsertWithWhereUniqueNestedInput {
  where: TagWhereUniqueInput!
  update: TagUpdateDataInput!
  create: TagCreateInput!
}

input TagWhereInput {
  slug: String
  slug_not: String
  slug_in: [String!]
  slug_not_in: [String!]
  slug_lt: String
  slug_lte: String
  slug_gt: String
  slug_gte: String
  slug_contains: String
  slug_not_contains: String
  slug_starts_with: String
  slug_not_starts_with: String
  slug_ends_with: String
  slug_not_ends_with: String
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  AND: [TagWhereInput!]
  OR: [TagWhereInput!]
  NOT: [TagWhereInput!]
}

input TagWhereUniqueInput {
  slug: String
  name: String
}

type User {
  id: ID!
  name: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type UserConnection {
  pageInfo: PageInfo!
  edges: [UserEdge]!
  aggregate: AggregateUser!
}

input UserCreateInput {
  name: String!
}

type UserEdge {
  node: User!
  cursor: String!
}

enum UserOrderByInput {
  id_ASC
  id_DESC
  name_ASC
  name_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type UserPreviousValues {
  id: ID!
  name: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type UserSubscriptionPayload {
  mutation: MutationType!
  node: User
  updatedFields: [String!]
  previousValues: UserPreviousValues
}

input UserSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: UserWhereInput
  AND: [UserSubscriptionWhereInput!]
  OR: [UserSubscriptionWhereInput!]
  NOT: [UserSubscriptionWhereInput!]
}

input UserUpdateInput {
  name: String
}

input UserUpdateManyMutationInput {
  name: String
}

input UserWhereInput {
  id: ID
  id_not: ID
  id_in: [ID!]
  id_not_in: [ID!]
  id_lt: ID
  id_lte: ID
  id_gt: ID
  id_gte: ID
  id_contains: ID
  id_not_contains: ID
  id_starts_with: ID
  id_not_starts_with: ID
  id_ends_with: ID
  id_not_ends_with: ID
  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
  createdAt: DateTime
  createdAt_not: DateTime
  createdAt_in: [DateTime!]
  createdAt_not_in: [DateTime!]
  createdAt_lt: DateTime
  createdAt_lte: DateTime
  createdAt_gt: DateTime
  createdAt_gte: DateTime
  updatedAt: DateTime
  updatedAt_not: DateTime
  updatedAt_in: [DateTime!]
  updatedAt_not_in: [DateTime!]
  updatedAt_lt: DateTime
  updatedAt_lte: DateTime
  updatedAt_gt: DateTime
  updatedAt_gte: DateTime
  AND: [UserWhereInput!]
  OR: [UserWhereInput!]
  NOT: [UserWhereInput!]
}

input UserWhereUniqueInput {
  id: ID
}
`
      }
    