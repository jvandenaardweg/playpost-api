"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
exports.removeFile = (fileName) => __awaiter(this, void 0, void 0, function* () {
    try {
        yield fs_extra_1.default.remove(fileName);
        console.log(`Removed file/folder: ${fileName}`);
        return fileName;
    }
    catch (err) {
        console.error(err);
        throw new Error(err);
    }
});
exports.removeFiles = (fileNames) => {
    const promises = [];
    fileNames.forEach(fileName => promises.push(exports.removeFile(fileName)));
    return Promise.all(promises);
};
//# sourceMappingURL=local.js.map