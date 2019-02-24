const fs = require('fs-extra');

const removeFile = async (fileName) => {
  try {
    await fs.remove(fileName);
    console.log(`Removed file/folder: ${fileName}`);
    return fileName;
  } catch (err) {
    console.error(err);
    return new Error(err);
  }
};

const removeFiles = (fileNames) => {
  const promises = [];
  fileNames.forEach(fileName => promises.push(removeFile(fileName)));
  return Promise.all(promises);
};

module.exports = {
  removeFiles,
  removeFile
};
