// import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, AfterInsert, OneToOne, JoinColumn } from 'typeorm';
// import { IsEmail, IsDate, IsUUID } from 'class-validator';
// import { User } from './User';

// @Entity()
// export class Playlist {

//   @PrimaryGeneratedColumn('uuid')
//   @IsUUID()
//   id: string;

//   @OneToOne(type => User)
//   @JoinColumn()
//   user: User;

//   // articles

//   @CreateDateColumn({ nullable: false })
//   @IsDate()
//   createdAt: Date;

//   @UpdateDateColumn()
//   @IsDate()
//   updatedAt: Date;

// }
// /*

// type Playlist {
//   user: User! @relation(name: "UserToPlaylist")
//   article: Article! @relation(name: "ArticleToPlaylist")
//   order: Int!
//   createdAt: DateTime!
//   updatedAt: DateTime!
// }

// */
