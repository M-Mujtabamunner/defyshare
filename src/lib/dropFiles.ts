// Recursively walk a dropped entry to gather files (folder support)
const readEntries = (reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> =>
  new Promise((resolve, reject) => reader.readEntries(resolve, reject));

const walkEntry = async (entry: FileSystemEntry, path = ''): Promise<File[]> => {
  if (entry.isFile) {
    return new Promise<File[]>((resolve, reject) =>
      (entry as FileSystemFileEntry).file((file: File) => {
        try {
          // preserve relative path
          Object.defineProperty(file, 'webkitRelativePath', { value: path + file.name });
        } catch { /* ignore */ }
        resolve([file]);
      }, reject),
    );
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const all: File[] = [];
    let batch = await readEntries(reader);
    while (batch.length > 0) {
      for (const child of batch) {
        const files = await walkEntry(child, path + entry.name + '/');
        all.push(...files);
      }
      batch = await readEntries(reader);
    }
    return all;
  }
  return [];
};

export const collectFilesFromDataTransfer = async (dt: DataTransfer): Promise<File[]> => {
  const items = dt.items ? Array.from(dt.items) : [];
  const entries = items
    .map((item) => item.webkitGetAsEntry?.())
    .filter((e): e is FileSystemEntry => !!e);
  if (entries.length > 0) {
    const groups = await Promise.all(entries.map((e) => walkEntry(e)));
    return groups.flat();
  }
  return Array.from(dt.files || []);
};
