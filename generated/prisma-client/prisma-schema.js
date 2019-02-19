module.exports = {
        typeDefs: /* GraphQL */ `type AggregateArchive {
  count: Int!
}

type AggregateArticle {
  count: Int!
}

type AggregateAudiofile {
  count: Int!
}

type AggregateFavorite {
  count: Int!
}

type AggregatePlaylist {
  count: Int!
}

type AggregateUser {
  count: Int!
}

type Archive {
  user: User!
  article: Article!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type ArchiveConnection {
  pageInfo: PageInfo!
  edges: [ArchiveEdge]!
  aggregate: AggregateArchive!
}

input ArchiveCreateInput {
  user: UserCreateOneWithoutArchiveInput!
  article: ArticleCreateOneWithoutArchivesInput!
}

input ArchiveCreateManyWithoutArticleInput {
  create: [ArchiveCreateWithoutArticleInput!]
}

input ArchiveCreateManyWithoutUserInput {
  create: [ArchiveCreateWithoutUserInput!]
}

input ArchiveCreateWithoutArticleInput {
  user: UserCreateOneWithoutArchiveInput!
}

input ArchiveCreateWithoutUserInput {
  article: ArticleCreateOneWithoutArchivesInput!
}

type ArchiveEdge {
  node: Archive!
  cursor: String!
}

enum ArchiveOrderByInput {
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
  id_ASC
  id_DESC
}

type ArchivePreviousValues {
  createdAt: DateTime!
  updatedAt: DateTime!
}

input ArchiveScalarWhereInput {
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
  AND: [ArchiveScalarWhereInput!]
  OR: [ArchiveScalarWhereInput!]
  NOT: [ArchiveScalarWhereInput!]
}

type ArchiveSubscriptionPayload {
  mutation: MutationType!
  node: Archive
  updatedFields: [String!]
  previousValues: ArchivePreviousValues
}

input ArchiveSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: ArchiveWhereInput
  AND: [ArchiveSubscriptionWhereInput!]
  OR: [ArchiveSubscriptionWhereInput!]
  NOT: [ArchiveSubscriptionWhereInput!]
}

input ArchiveUpdateManyWithoutArticleInput {
  create: [ArchiveCreateWithoutArticleInput!]
  deleteMany: [ArchiveScalarWhereInput!]
}

input ArchiveUpdateManyWithoutUserInput {
  create: [ArchiveCreateWithoutUserInput!]
  deleteMany: [ArchiveScalarWhereInput!]
}

input ArchiveWhereInput {
  user: UserWhereInput
  article: ArticleWhereInput
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
  AND: [ArchiveWhereInput!]
  OR: [ArchiveWhereInput!]
  NOT: [ArchiveWhereInput!]
}

type Article {
  id: ID!
  title: String!
  description: String
  url: String!
  imageUrl: String
  readingTime: Float
  language: Language!
  authorName: String
  authorUrl: String
  categoryName: String
  html: String
  ssml: String
  text: String
  sourceName: String
  user: User!
  audiofiles(where: AudiofileWhereInput, orderBy: AudiofileOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Audiofile!]
  playlists(where: PlaylistWhereInput, orderBy: PlaylistOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Playlist!]
  archives(where: ArchiveWhereInput, orderBy: ArchiveOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Archive!]
  favorites(where: FavoriteWhereInput, orderBy: FavoriteOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Favorite!]
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
  description: String
  url: String!
  imageUrl: String
  readingTime: Float
  language: Language!
  authorName: String
  authorUrl: String
  categoryName: String
  html: String
  ssml: String
  text: String
  sourceName: String
  user: UserCreateOneInput!
  audiofiles: AudiofileCreateManyWithoutArticleInput
  playlists: PlaylistCreateManyWithoutArticleInput
  archives: ArchiveCreateManyWithoutArticleInput
  favorites: FavoriteCreateManyWithoutArticleInput
}

input ArticleCreateOneWithoutArchivesInput {
  create: ArticleCreateWithoutArchivesInput
  connect: ArticleWhereUniqueInput
}

input ArticleCreateOneWithoutAudiofilesInput {
  create: ArticleCreateWithoutAudiofilesInput
  connect: ArticleWhereUniqueInput
}

input ArticleCreateOneWithoutFavoritesInput {
  create: ArticleCreateWithoutFavoritesInput
  connect: ArticleWhereUniqueInput
}

input ArticleCreateOneWithoutPlaylistsInput {
  create: ArticleCreateWithoutPlaylistsInput
  connect: ArticleWhereUniqueInput
}

input ArticleCreateWithoutArchivesInput {
  title: String!
  description: String
  url: String!
  imageUrl: String
  readingTime: Float
  language: Language!
  authorName: String
  authorUrl: String
  categoryName: String
  html: String
  ssml: String
  text: String
  sourceName: String
  user: UserCreateOneInput!
  audiofiles: AudiofileCreateManyWithoutArticleInput
  playlists: PlaylistCreateManyWithoutArticleInput
  favorites: FavoriteCreateManyWithoutArticleInput
}

input ArticleCreateWithoutAudiofilesInput {
  title: String!
  description: String
  url: String!
  imageUrl: String
  readingTime: Float
  language: Language!
  authorName: String
  authorUrl: String
  categoryName: String
  html: String
  ssml: String
  text: String
  sourceName: String
  user: UserCreateOneInput!
  playlists: PlaylistCreateManyWithoutArticleInput
  archives: ArchiveCreateManyWithoutArticleInput
  favorites: FavoriteCreateManyWithoutArticleInput
}

input ArticleCreateWithoutFavoritesInput {
  title: String!
  description: String
  url: String!
  imageUrl: String
  readingTime: Float
  language: Language!
  authorName: String
  authorUrl: String
  categoryName: String
  html: String
  ssml: String
  text: String
  sourceName: String
  user: UserCreateOneInput!
  audiofiles: AudiofileCreateManyWithoutArticleInput
  playlists: PlaylistCreateManyWithoutArticleInput
  archives: ArchiveCreateManyWithoutArticleInput
}

input ArticleCreateWithoutPlaylistsInput {
  title: String!
  description: String
  url: String!
  imageUrl: String
  readingTime: Float
  language: Language!
  authorName: String
  authorUrl: String
  categoryName: String
  html: String
  ssml: String
  text: String
  sourceName: String
  user: UserCreateOneInput!
  audiofiles: AudiofileCreateManyWithoutArticleInput
  archives: ArchiveCreateManyWithoutArticleInput
  favorites: FavoriteCreateManyWithoutArticleInput
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
  categoryName_ASC
  categoryName_DESC
  html_ASC
  html_DESC
  ssml_ASC
  ssml_DESC
  text_ASC
  text_DESC
  sourceName_ASC
  sourceName_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type ArticlePreviousValues {
  id: ID!
  title: String!
  description: String
  url: String!
  imageUrl: String
  readingTime: Float
  language: Language!
  authorName: String
  authorUrl: String
  categoryName: String
  html: String
  ssml: String
  text: String
  sourceName: String
  createdAt: DateTime!
  updatedAt: DateTime!
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
  description: String
  url: String
  imageUrl: String
  readingTime: Float
  language: Language
  authorName: String
  authorUrl: String
  categoryName: String
  html: String
  ssml: String
  text: String
  sourceName: String
  user: UserUpdateOneRequiredInput
  audiofiles: AudiofileUpdateManyWithoutArticleInput
  playlists: PlaylistUpdateManyWithoutArticleInput
  archives: ArchiveUpdateManyWithoutArticleInput
  favorites: FavoriteUpdateManyWithoutArticleInput
}

input ArticleUpdateManyMutationInput {
  title: String
  description: String
  url: String
  imageUrl: String
  readingTime: Float
  language: Language
  authorName: String
  authorUrl: String
  categoryName: String
  html: String
  ssml: String
  text: String
  sourceName: String
}

input ArticleUpdateOneRequiredWithoutAudiofilesInput {
  create: ArticleCreateWithoutAudiofilesInput
  update: ArticleUpdateWithoutAudiofilesDataInput
  upsert: ArticleUpsertWithoutAudiofilesInput
  connect: ArticleWhereUniqueInput
}

input ArticleUpdateWithoutAudiofilesDataInput {
  title: String
  description: String
  url: String
  imageUrl: String
  readingTime: Float
  language: Language
  authorName: String
  authorUrl: String
  categoryName: String
  html: String
  ssml: String
  text: String
  sourceName: String
  user: UserUpdateOneRequiredInput
  playlists: PlaylistUpdateManyWithoutArticleInput
  archives: ArchiveUpdateManyWithoutArticleInput
  favorites: FavoriteUpdateManyWithoutArticleInput
}

input ArticleUpsertWithoutAudiofilesInput {
  update: ArticleUpdateWithoutAudiofilesDataInput!
  create: ArticleCreateWithoutAudiofilesInput!
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
  categoryName: String
  categoryName_not: String
  categoryName_in: [String!]
  categoryName_not_in: [String!]
  categoryName_lt: String
  categoryName_lte: String
  categoryName_gt: String
  categoryName_gte: String
  categoryName_contains: String
  categoryName_not_contains: String
  categoryName_starts_with: String
  categoryName_not_starts_with: String
  categoryName_ends_with: String
  categoryName_not_ends_with: String
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
  text: String
  text_not: String
  text_in: [String!]
  text_not_in: [String!]
  text_lt: String
  text_lte: String
  text_gt: String
  text_gte: String
  text_contains: String
  text_not_contains: String
  text_starts_with: String
  text_not_starts_with: String
  text_ends_with: String
  text_not_ends_with: String
  sourceName: String
  sourceName_not: String
  sourceName_in: [String!]
  sourceName_not_in: [String!]
  sourceName_lt: String
  sourceName_lte: String
  sourceName_gt: String
  sourceName_gte: String
  sourceName_contains: String
  sourceName_not_contains: String
  sourceName_starts_with: String
  sourceName_not_starts_with: String
  sourceName_ends_with: String
  sourceName_not_ends_with: String
  user: UserWhereInput
  audiofiles_every: AudiofileWhereInput
  audiofiles_some: AudiofileWhereInput
  audiofiles_none: AudiofileWhereInput
  playlists_every: PlaylistWhereInput
  playlists_some: PlaylistWhereInput
  playlists_none: PlaylistWhereInput
  archives_every: ArchiveWhereInput
  archives_some: ArchiveWhereInput
  archives_none: ArchiveWhereInput
  favorites_every: FavoriteWhereInput
  favorites_some: FavoriteWhereInput
  favorites_none: FavoriteWhereInput
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
  encoding: Encoding!
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
  encoding: Encoding!
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
  encoding: Encoding!
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
  encoding_ASC
  encoding_DESC
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
  encoding: Encoding!
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
  encoding: Encoding
  encoding_not: Encoding
  encoding_in: [Encoding!]
  encoding_not_in: [Encoding!]
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
  encoding: Encoding
  voice: String
  synthesizer: Synthesizer
  listens: Int
}

input AudiofileUpdateManyDataInput {
  url: String
  length: Float
  language: Language
  encoding: Encoding
  voice: String
  synthesizer: Synthesizer
  listens: Int
}

input AudiofileUpdateManyMutationInput {
  url: String
  length: Float
  language: Language
  encoding: Encoding
  voice: String
  synthesizer: Synthesizer
  listens: Int
}

input AudiofileUpdateManyWithoutArticleInput {
  create: [AudiofileCreateWithoutArticleInput!]
  delete: [AudiofileWhereUniqueInput!]
  connect: [AudiofileWhereUniqueInput!]
  set: [AudiofileWhereUniqueInput!]
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
  encoding: Encoding
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
  encoding: Encoding
  encoding_not: Encoding
  encoding_in: [Encoding!]
  encoding_not_in: [Encoding!]
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

enum Encoding {
  MP3
  OGG
  PCM
}

type Favorite {
  user: User!
  article: Article!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type FavoriteConnection {
  pageInfo: PageInfo!
  edges: [FavoriteEdge]!
  aggregate: AggregateFavorite!
}

input FavoriteCreateInput {
  user: UserCreateOneWithoutFavoritesInput!
  article: ArticleCreateOneWithoutFavoritesInput!
}

input FavoriteCreateManyWithoutArticleInput {
  create: [FavoriteCreateWithoutArticleInput!]
}

input FavoriteCreateManyWithoutUserInput {
  create: [FavoriteCreateWithoutUserInput!]
}

input FavoriteCreateWithoutArticleInput {
  user: UserCreateOneWithoutFavoritesInput!
}

input FavoriteCreateWithoutUserInput {
  article: ArticleCreateOneWithoutFavoritesInput!
}

type FavoriteEdge {
  node: Favorite!
  cursor: String!
}

enum FavoriteOrderByInput {
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
  id_ASC
  id_DESC
}

type FavoritePreviousValues {
  createdAt: DateTime!
  updatedAt: DateTime!
}

input FavoriteScalarWhereInput {
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
  AND: [FavoriteScalarWhereInput!]
  OR: [FavoriteScalarWhereInput!]
  NOT: [FavoriteScalarWhereInput!]
}

type FavoriteSubscriptionPayload {
  mutation: MutationType!
  node: Favorite
  updatedFields: [String!]
  previousValues: FavoritePreviousValues
}

input FavoriteSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: FavoriteWhereInput
  AND: [FavoriteSubscriptionWhereInput!]
  OR: [FavoriteSubscriptionWhereInput!]
  NOT: [FavoriteSubscriptionWhereInput!]
}

input FavoriteUpdateManyWithoutArticleInput {
  create: [FavoriteCreateWithoutArticleInput!]
  deleteMany: [FavoriteScalarWhereInput!]
}

input FavoriteUpdateManyWithoutUserInput {
  create: [FavoriteCreateWithoutUserInput!]
  deleteMany: [FavoriteScalarWhereInput!]
}

input FavoriteWhereInput {
  user: UserWhereInput
  article: ArticleWhereInput
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
  AND: [FavoriteWhereInput!]
  OR: [FavoriteWhereInput!]
  NOT: [FavoriteWhereInput!]
}

enum Language {
  EN
}

scalar Long

type Mutation {
  createArchive(data: ArchiveCreateInput!): Archive!
  deleteManyArchives(where: ArchiveWhereInput): BatchPayload!
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
  createFavorite(data: FavoriteCreateInput!): Favorite!
  deleteManyFavorites(where: FavoriteWhereInput): BatchPayload!
  createPlaylist(data: PlaylistCreateInput!): Playlist!
  updateManyPlaylists(data: PlaylistUpdateManyMutationInput!, where: PlaylistWhereInput): BatchPayload!
  deleteManyPlaylists(where: PlaylistWhereInput): BatchPayload!
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

type Playlist {
  user: User!
  article: Article!
  order: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type PlaylistConnection {
  pageInfo: PageInfo!
  edges: [PlaylistEdge]!
  aggregate: AggregatePlaylist!
}

input PlaylistCreateInput {
  user: UserCreateOneWithoutPlaylistInput!
  article: ArticleCreateOneWithoutPlaylistsInput!
  order: Int!
}

input PlaylistCreateManyWithoutArticleInput {
  create: [PlaylistCreateWithoutArticleInput!]
}

input PlaylistCreateManyWithoutUserInput {
  create: [PlaylistCreateWithoutUserInput!]
}

input PlaylistCreateWithoutArticleInput {
  user: UserCreateOneWithoutPlaylistInput!
  order: Int!
}

input PlaylistCreateWithoutUserInput {
  article: ArticleCreateOneWithoutPlaylistsInput!
  order: Int!
}

type PlaylistEdge {
  node: Playlist!
  cursor: String!
}

enum PlaylistOrderByInput {
  order_ASC
  order_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
  id_ASC
  id_DESC
}

type PlaylistPreviousValues {
  order: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
}

input PlaylistScalarWhereInput {
  order: Int
  order_not: Int
  order_in: [Int!]
  order_not_in: [Int!]
  order_lt: Int
  order_lte: Int
  order_gt: Int
  order_gte: Int
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
  AND: [PlaylistScalarWhereInput!]
  OR: [PlaylistScalarWhereInput!]
  NOT: [PlaylistScalarWhereInput!]
}

type PlaylistSubscriptionPayload {
  mutation: MutationType!
  node: Playlist
  updatedFields: [String!]
  previousValues: PlaylistPreviousValues
}

input PlaylistSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: PlaylistWhereInput
  AND: [PlaylistSubscriptionWhereInput!]
  OR: [PlaylistSubscriptionWhereInput!]
  NOT: [PlaylistSubscriptionWhereInput!]
}

input PlaylistUpdateManyDataInput {
  order: Int
}

input PlaylistUpdateManyMutationInput {
  order: Int
}

input PlaylistUpdateManyWithoutArticleInput {
  create: [PlaylistCreateWithoutArticleInput!]
  deleteMany: [PlaylistScalarWhereInput!]
  updateMany: [PlaylistUpdateManyWithWhereNestedInput!]
}

input PlaylistUpdateManyWithoutUserInput {
  create: [PlaylistCreateWithoutUserInput!]
  deleteMany: [PlaylistScalarWhereInput!]
  updateMany: [PlaylistUpdateManyWithWhereNestedInput!]
}

input PlaylistUpdateManyWithWhereNestedInput {
  where: PlaylistScalarWhereInput!
  data: PlaylistUpdateManyDataInput!
}

input PlaylistWhereInput {
  user: UserWhereInput
  article: ArticleWhereInput
  order: Int
  order_not: Int
  order_in: [Int!]
  order_not_in: [Int!]
  order_lt: Int
  order_lte: Int
  order_gt: Int
  order_gte: Int
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
  AND: [PlaylistWhereInput!]
  OR: [PlaylistWhereInput!]
  NOT: [PlaylistWhereInput!]
}

type Query {
  archives(where: ArchiveWhereInput, orderBy: ArchiveOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Archive]!
  archivesConnection(where: ArchiveWhereInput, orderBy: ArchiveOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): ArchiveConnection!
  article(where: ArticleWhereUniqueInput!): Article
  articles(where: ArticleWhereInput, orderBy: ArticleOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Article]!
  articlesConnection(where: ArticleWhereInput, orderBy: ArticleOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): ArticleConnection!
  audiofile(where: AudiofileWhereUniqueInput!): Audiofile
  audiofiles(where: AudiofileWhereInput, orderBy: AudiofileOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Audiofile]!
  audiofilesConnection(where: AudiofileWhereInput, orderBy: AudiofileOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): AudiofileConnection!
  favorites(where: FavoriteWhereInput, orderBy: FavoriteOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Favorite]!
  favoritesConnection(where: FavoriteWhereInput, orderBy: FavoriteOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): FavoriteConnection!
  playlists(where: PlaylistWhereInput, orderBy: PlaylistOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Playlist]!
  playlistsConnection(where: PlaylistWhereInput, orderBy: PlaylistOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): PlaylistConnection!
  user(where: UserWhereUniqueInput!): User
  users(where: UserWhereInput, orderBy: UserOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [User]!
  usersConnection(where: UserWhereInput, orderBy: UserOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): UserConnection!
  node(id: ID!): Node
}

type Subscription {
  archive(where: ArchiveSubscriptionWhereInput): ArchiveSubscriptionPayload
  article(where: ArticleSubscriptionWhereInput): ArticleSubscriptionPayload
  audiofile(where: AudiofileSubscriptionWhereInput): AudiofileSubscriptionPayload
  favorite(where: FavoriteSubscriptionWhereInput): FavoriteSubscriptionPayload
  playlist(where: PlaylistSubscriptionWhereInput): PlaylistSubscriptionPayload
  user(where: UserSubscriptionWhereInput): UserSubscriptionPayload
}

enum Synthesizer {
  GOOGLE
  AWS
}

type User {
  id: ID!
  email: String!
  password: String!
  playlist(where: PlaylistWhereInput, orderBy: PlaylistOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Playlist!]
  archive(where: ArchiveWhereInput, orderBy: ArchiveOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Archive!]
  favorites(where: FavoriteWhereInput, orderBy: FavoriteOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Favorite!]
  authenticatedAt: DateTime
  activatedAt: DateTime
  deletedAt: DateTime
  createdAt: DateTime!
  updatedAt: DateTime!
}

type UserConnection {
  pageInfo: PageInfo!
  edges: [UserEdge]!
  aggregate: AggregateUser!
}

input UserCreateInput {
  email: String!
  password: String!
  playlist: PlaylistCreateManyWithoutUserInput
  archive: ArchiveCreateManyWithoutUserInput
  favorites: FavoriteCreateManyWithoutUserInput
  authenticatedAt: DateTime
  activatedAt: DateTime
  deletedAt: DateTime
}

input UserCreateOneInput {
  create: UserCreateInput
  connect: UserWhereUniqueInput
}

input UserCreateOneWithoutArchiveInput {
  create: UserCreateWithoutArchiveInput
  connect: UserWhereUniqueInput
}

input UserCreateOneWithoutFavoritesInput {
  create: UserCreateWithoutFavoritesInput
  connect: UserWhereUniqueInput
}

input UserCreateOneWithoutPlaylistInput {
  create: UserCreateWithoutPlaylistInput
  connect: UserWhereUniqueInput
}

input UserCreateWithoutArchiveInput {
  email: String!
  password: String!
  playlist: PlaylistCreateManyWithoutUserInput
  favorites: FavoriteCreateManyWithoutUserInput
  authenticatedAt: DateTime
  activatedAt: DateTime
  deletedAt: DateTime
}

input UserCreateWithoutFavoritesInput {
  email: String!
  password: String!
  playlist: PlaylistCreateManyWithoutUserInput
  archive: ArchiveCreateManyWithoutUserInput
  authenticatedAt: DateTime
  activatedAt: DateTime
  deletedAt: DateTime
}

input UserCreateWithoutPlaylistInput {
  email: String!
  password: String!
  archive: ArchiveCreateManyWithoutUserInput
  favorites: FavoriteCreateManyWithoutUserInput
  authenticatedAt: DateTime
  activatedAt: DateTime
  deletedAt: DateTime
}

type UserEdge {
  node: User!
  cursor: String!
}

enum UserOrderByInput {
  id_ASC
  id_DESC
  email_ASC
  email_DESC
  password_ASC
  password_DESC
  authenticatedAt_ASC
  authenticatedAt_DESC
  activatedAt_ASC
  activatedAt_DESC
  deletedAt_ASC
  deletedAt_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type UserPreviousValues {
  id: ID!
  email: String!
  password: String!
  authenticatedAt: DateTime
  activatedAt: DateTime
  deletedAt: DateTime
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

input UserUpdateDataInput {
  email: String
  password: String
  playlist: PlaylistUpdateManyWithoutUserInput
  archive: ArchiveUpdateManyWithoutUserInput
  favorites: FavoriteUpdateManyWithoutUserInput
  authenticatedAt: DateTime
  activatedAt: DateTime
  deletedAt: DateTime
}

input UserUpdateInput {
  email: String
  password: String
  playlist: PlaylistUpdateManyWithoutUserInput
  archive: ArchiveUpdateManyWithoutUserInput
  favorites: FavoriteUpdateManyWithoutUserInput
  authenticatedAt: DateTime
  activatedAt: DateTime
  deletedAt: DateTime
}

input UserUpdateManyMutationInput {
  email: String
  password: String
  authenticatedAt: DateTime
  activatedAt: DateTime
  deletedAt: DateTime
}

input UserUpdateOneRequiredInput {
  create: UserCreateInput
  update: UserUpdateDataInput
  upsert: UserUpsertNestedInput
  connect: UserWhereUniqueInput
}

input UserUpsertNestedInput {
  update: UserUpdateDataInput!
  create: UserCreateInput!
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
  email: String
  email_not: String
  email_in: [String!]
  email_not_in: [String!]
  email_lt: String
  email_lte: String
  email_gt: String
  email_gte: String
  email_contains: String
  email_not_contains: String
  email_starts_with: String
  email_not_starts_with: String
  email_ends_with: String
  email_not_ends_with: String
  password: String
  password_not: String
  password_in: [String!]
  password_not_in: [String!]
  password_lt: String
  password_lte: String
  password_gt: String
  password_gte: String
  password_contains: String
  password_not_contains: String
  password_starts_with: String
  password_not_starts_with: String
  password_ends_with: String
  password_not_ends_with: String
  playlist_every: PlaylistWhereInput
  playlist_some: PlaylistWhereInput
  playlist_none: PlaylistWhereInput
  archive_every: ArchiveWhereInput
  archive_some: ArchiveWhereInput
  archive_none: ArchiveWhereInput
  favorites_every: FavoriteWhereInput
  favorites_some: FavoriteWhereInput
  favorites_none: FavoriteWhereInput
  authenticatedAt: DateTime
  authenticatedAt_not: DateTime
  authenticatedAt_in: [DateTime!]
  authenticatedAt_not_in: [DateTime!]
  authenticatedAt_lt: DateTime
  authenticatedAt_lte: DateTime
  authenticatedAt_gt: DateTime
  authenticatedAt_gte: DateTime
  activatedAt: DateTime
  activatedAt_not: DateTime
  activatedAt_in: [DateTime!]
  activatedAt_not_in: [DateTime!]
  activatedAt_lt: DateTime
  activatedAt_lte: DateTime
  activatedAt_gt: DateTime
  activatedAt_gte: DateTime
  deletedAt: DateTime
  deletedAt_not: DateTime
  deletedAt_in: [DateTime!]
  deletedAt_not_in: [DateTime!]
  deletedAt_lt: DateTime
  deletedAt_lte: DateTime
  deletedAt_gt: DateTime
  deletedAt_gte: DateTime
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
  email: String
}
`
      }
    