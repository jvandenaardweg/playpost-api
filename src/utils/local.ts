import fs from 'fs-extra';

export const removeFile = async (fileName: string) => {
  try {
    await fs.remove(fileName);
    console.log(`Removed file/folder: ${fileName}`);
    return fileName;
  } catch (err) {
    console.error(err);
    throw new Error(err);
  }
};

export const removeFiles = (fileNames: Array<string>) => {
  const promises: Array<any> = [];
  fileNames.forEach(fileName => promises.push(removeFile(fileName)));
  return Promise.all(promises);
};
