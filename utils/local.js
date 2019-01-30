const fs = require('fs-extra');


function removeFiles (fileNames) {
    let promises = [];
    fileNames.forEach((fileName) => promises.push(removeFile(fileName)));
    return Promise.all(promises);
}

async function removeFile (fileName) {
    try {
      await fs.remove(fileName);
      return fileName;
    } catch (err) {
      console.error(err);
    }
  }


module.exports = { removeFiles, removeFile }