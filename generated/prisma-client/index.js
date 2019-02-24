"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var prisma_lib_1 = require("prisma-client-lib");
var typeDefs = require("./prisma-schema").typeDefs;

var models = [
  {
    name: "Archive",
    embedded: false
  },
  {
    name: "Article",
    embedded: false
  },
  {
    name: "Audiofile",
    embedded: false
  },
  {
    name: "Encoding",
    embedded: false
  },
  {
    name: "Favorite",
    embedded: false
  },
  {
    name: "Language",
    embedded: false
  },
  {
    name: "Playlist",
    embedded: false
  },
  {
    name: "Synthesizer",
    embedded: false
  },
  {
    name: "User",
    embedded: false
  }
];
exports.Prisma = prisma_lib_1.makePrismaClientClass({
  typeDefs,
  models,
  endpoint: `${process.env["PRISMA_ENDPOINT"]}`,
  secret: `MQ1gswkegQ793ZMO0zveHLnx46VVOHSz`
});
exports.prisma = new exports.Prisma();
