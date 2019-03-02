import fsExtra from 'fs-extra';

export const removeFile = async (fileName: string) => {
  try {
    await fsExtra.remove(fileName);
    console.log(`Removed file/folder: ${fileName}`);
    return fileName;
  } catch (err) {
    console.error(err);
    throw new Error(err);
  }
};

export const removeFiles = (fileNames: string[]) => {
  const promises: Promise<any>[] = [];
  fileNames.forEach(fileName => promises.push(removeFile(fileName)));
  return Promise.all(promises);
};
