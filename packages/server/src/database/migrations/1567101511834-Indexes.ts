import {MigrationInterface, QueryRunner} from "typeorm";

export class Indexes1567101511834 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "IDX_8d7afb45fa96df4e055e731e2e"`);
        await queryRunner.query(`DROP INDEX "IDX_3d46f8e6297dffad023cd1d928"`);
        await queryRunner.query(`DROP INDEX "IDX_8fc4e7d6da854b80bc70ac7d15"`);
        await queryRunner.query(`DROP INDEX "IDX_81d1d33477b0e90929d1995d29"`);
        await queryRunner.query(`DROP INDEX "IDX_8da9f84d215ca0729bbde6ba64"`);
        await queryRunner.query(`DROP INDEX "IDX_fa5a22970beff182c3625c5c32"`);
        await queryRunner.query(`DROP INDEX "IDX_f3f71e04b9063a3aa374924821"`);
        await queryRunner.query(`DROP INDEX "IDX_1f097e10212f7e5b9b63e9ffe7"`);
        await queryRunner.query(`CREATE INDEX "IDX_465b3173cdddf0ac2d3fe73a33" ON "language" ("code") `);
        await queryRunner.query(`CREATE INDEX "IDX_3a7abee35dfa3c90ed491583eb" ON "language" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_170547728fdf47e4b34b796837" ON "voice" ("languageCode") `);
        await queryRunner.query(`CREATE INDEX "IDX_633d2cb0a5e513df5c9256a6fb" ON "voice" ("quality") `);
        await queryRunner.query(`CREATE INDEX "IDX_df5475f14764b140c2bd4deca4" ON "voice" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_013c4c906d05a3531472ea75a5" ON "voice" ("isPremium") `);
        await queryRunner.query(`CREATE INDEX "IDX_6325930bd45df721e91288bac1" ON "voice" ("isHighestQuality") `);
        await queryRunner.query(`CREATE INDEX "IDX_caa951dd1ff56ba07d1e01aa23" ON "audiofile" ("articleId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e69706b0b79142683b99400553" ON "audiofile" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_3bdb904f4a871d58ee9ababfd9" ON "audiofile" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_908e8dc9fa9f30fd169ddc47b8" ON "playlist_item" ("articleId") `);
        await queryRunner.query(`CREATE INDEX "IDX_09f764f36697f296cb94190e31" ON "playlist_item" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_562f13f9b1e22cf0127160f8a7" ON "playlist_item" ("order") `);
        await queryRunner.query(`CREATE INDEX "IDX_8bd2df28406b98de3483a436ca" ON "playlist_item" ("archivedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_baed77124918de053ca0a8ffc6" ON "playlist_item" ("favoritedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_b99fa71c07cc9a8421bd36bb1d" ON "article" ("url") `);
        await queryRunner.query(`CREATE INDEX "IDX_0e4eaae669e0f23d736a0a7a75" ON "article" ("canonicalUrl") `);
        await queryRunner.query(`CREATE INDEX "IDX_82999a92d2737aea8dcb19a986" ON "in_app_subscription" ("productId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f458807a4c256a03b2838456b4" ON "in_app_subscription" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_28fc2773e1d1216f5eb71fdbc9" ON "user_in_app_subscription" ("latestTransactionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_18d79e86f9c79e5dc2526d4a51" ON "user_in_app_subscription" ("originalTransactionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a23b37165e60ecca7939d4178d" ON "user_in_app_subscription" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_091515b4405e5c5c3854e4ae9b" ON "user_in_app_subscription" ("inAppSubscriptionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ede39338a9d0b3f41f21f71ee8" ON "user_voice_setting" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_6ebc60a3e6e3f210153f355f2b" ON "user_voice_setting" ("voiceId") `);
        await queryRunner.query(`CREATE INDEX "IDX_4af2845dc9ca75322047e5a042" ON "user_voice_setting" ("languageId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e12875dfb3b1d92d7d7c5377e2" ON "user" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_fb080786c16de6ace7ed0b69f7" ON "api_key" ("key") `);
        await queryRunner.query(`CREATE INDEX "IDX_1987d47f5e39ca1043af303295" ON "api_key" ("signature") `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "IDX_1987d47f5e39ca1043af303295"`);
        await queryRunner.query(`DROP INDEX "IDX_fb080786c16de6ace7ed0b69f7"`);
        await queryRunner.query(`DROP INDEX "IDX_e12875dfb3b1d92d7d7c5377e2"`);
        await queryRunner.query(`DROP INDEX "IDX_4af2845dc9ca75322047e5a042"`);
        await queryRunner.query(`DROP INDEX "IDX_6ebc60a3e6e3f210153f355f2b"`);
        await queryRunner.query(`DROP INDEX "IDX_ede39338a9d0b3f41f21f71ee8"`);
        await queryRunner.query(`DROP INDEX "IDX_091515b4405e5c5c3854e4ae9b"`);
        await queryRunner.query(`DROP INDEX "IDX_a23b37165e60ecca7939d4178d"`);
        await queryRunner.query(`DROP INDEX "IDX_18d79e86f9c79e5dc2526d4a51"`);
        await queryRunner.query(`DROP INDEX "IDX_28fc2773e1d1216f5eb71fdbc9"`);
        await queryRunner.query(`DROP INDEX "IDX_f458807a4c256a03b2838456b4"`);
        await queryRunner.query(`DROP INDEX "IDX_82999a92d2737aea8dcb19a986"`);
        await queryRunner.query(`DROP INDEX "IDX_0e4eaae669e0f23d736a0a7a75"`);
        await queryRunner.query(`DROP INDEX "IDX_b99fa71c07cc9a8421bd36bb1d"`);
        await queryRunner.query(`DROP INDEX "IDX_baed77124918de053ca0a8ffc6"`);
        await queryRunner.query(`DROP INDEX "IDX_8bd2df28406b98de3483a436ca"`);
        await queryRunner.query(`DROP INDEX "IDX_562f13f9b1e22cf0127160f8a7"`);
        await queryRunner.query(`DROP INDEX "IDX_09f764f36697f296cb94190e31"`);
        await queryRunner.query(`DROP INDEX "IDX_908e8dc9fa9f30fd169ddc47b8"`);
        await queryRunner.query(`DROP INDEX "IDX_3bdb904f4a871d58ee9ababfd9"`);
        await queryRunner.query(`DROP INDEX "IDX_e69706b0b79142683b99400553"`);
        await queryRunner.query(`DROP INDEX "IDX_caa951dd1ff56ba07d1e01aa23"`);
        await queryRunner.query(`DROP INDEX "IDX_6325930bd45df721e91288bac1"`);
        await queryRunner.query(`DROP INDEX "IDX_013c4c906d05a3531472ea75a5"`);
        await queryRunner.query(`DROP INDEX "IDX_df5475f14764b140c2bd4deca4"`);
        await queryRunner.query(`DROP INDEX "IDX_633d2cb0a5e513df5c9256a6fb"`);
        await queryRunner.query(`DROP INDEX "IDX_170547728fdf47e4b34b796837"`);
        await queryRunner.query(`DROP INDEX "IDX_3a7abee35dfa3c90ed491583eb"`);
        await queryRunner.query(`DROP INDEX "IDX_465b3173cdddf0ac2d3fe73a33"`);
        await queryRunner.query(`CREATE INDEX "IDX_1f097e10212f7e5b9b63e9ffe7" ON "user_voice_setting" ("userId", "voiceId", "languageId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f3f71e04b9063a3aa374924821" ON "user_in_app_subscription" ("latestTransactionId", "originalTransactionId", "userId", "inAppSubscriptionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_fa5a22970beff182c3625c5c32" ON "in_app_subscription" ("productId", "isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_8da9f84d215ca0729bbde6ba64" ON "article" ("url", "canonicalUrl") `);
        await queryRunner.query(`CREATE INDEX "IDX_81d1d33477b0e90929d1995d29" ON "playlist_item" ("order", "articleId", "userId", "archivedAt", "favoritedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_8fc4e7d6da854b80bc70ac7d15" ON "audiofile" ("createdAt", "articleId", "userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_3d46f8e6297dffad023cd1d928" ON "voice" ("languageCode", "isActive", "isPremium", "isHighestQuality", "quality") `);
        await queryRunner.query(`CREATE INDEX "IDX_8d7afb45fa96df4e055e731e2e" ON "language" ("code", "isActive") `);
    }

}
