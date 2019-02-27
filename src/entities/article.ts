import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsDate, IsUUID, IsUrl } from 'class-validator';
import { User } from './user';

@Entity()
export class Article {

  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ unique: true })
  @IsUrl()
  url: string;

  @Column()
  language: string;

  @Column()
  sourceName: string;

  // Not required
  @Column({ nullable: true })
  @IsUrl()
  imageUrl: string;

  @Column({ nullable: true })
  readingTime: number;

  @Column({ nullable: true })
  authorName: string;

  @Column({ nullable: true })
  @IsUrl()
  authorUrl: string;

  @Column({ nullable: true })
  categoryName: string;

  @Column('text', { nullable: true })
  html: string;

  @Column('text', { nullable: true })
  ssml: string;

  @Column('text', { nullable: true })
  text: string;

  @ManyToOne(type => User, user => user.articles, { nullable: true, onDelete: 'SET NULL' }) // On delete of a User, keep the Article in the database
  @JoinColumn()
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

}

/*
type Article {
  id: ID! @unique
  title: String!
  description: String
  url: String! @unique
  imageUrl: String
  readingTime: Float
  language: Language!
  authorName: String
  authorUrl: String
  categoryName: String
  html: String # The raw article HTML we took as a base to generate the SSML
  ssml: String # The generated SSML using <speak> <p> etc...
  text: String # Plain text of the article, using `\n` for new lines
  sourceName: String
  user: User @relation(name: "ArticleCreator") # A reference to which user created this article, we generally don't return this to other users , TODO: what happens when we delete a user?
  audiofiles: [Audiofile]! @relation(name: "ArticleAudiofiles", onDelete: CASCADE) # When we delete an article, we delete all audiofiles
  playlists: [Playlist!]! @relation(name: "ArticleToPlaylist")
  archives: [Archive!]! @relation(name: "ArticleToArchive")
  favorites: [Favorite!]! @relation(name: "ArticleToFavorite")
  createdAt: DateTime!
  updatedAt: DateTime!
}
*/
