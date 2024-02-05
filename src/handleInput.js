import fs from 'fs/promises';
import { readdir, statSync, createReadStream, createWriteStream } from 'fs';
import os from 'os';
import crypto from 'crypto';
import zlib from 'zlib';
import * as pathModule from 'path';
export const handleInput = async (input, currentPath) => {
  const homeDir = os.homedir();
  switch (input.split(' ')[0].toLowerCase()) {
    case 'exit':
      process.exit(0);
    case 'cd':
      const path = input.slice(3);
      try {
        const statsRelative = await fs.stat(`${currentPath}/${path}`);
        if (statsRelative.isDirectory()) {
          return `${currentPath}/${path}`;
        }
      } catch (err) {
        const statsAbsolute = await fs.stat(path);
        if (statsAbsolute.isDirectory()) {
          return path;
        }
      }

      break;
    case 'up':
      if (currentPath === homeDir) {
        return currentPath;
      }
      return (currentPath = currentPath.slice(0, currentPath.lastIndexOf('/')));
    case 'ls':
      readdir(currentPath, async (err, files) => {
        if (err) {
          console.error('Error reading directory:', err);
          return;
        }

        files = files.filter(file => !file.startsWith('.'));

        const tableData = [];

        files.forEach(file => {
          console.log(file, 'file');
          const filePath = pathModule.join(currentPath, file);

          const stats = statSync(filePath);

          const fileType = stats.isFile() ? 'File' : 'Directory';

          tableData.push({
            Name: file,
            Type: fileType,
          });
        });

        console.table(tableData.sort((a, b) => a.Type.localeCompare(b.Type)));
      });
      break;

    case 'cat':
      const file = input.split(' ')[1];
      const filePath = pathModule.join(currentPath, file);
      const readableStream = createReadStream(filePath, {
        encoding: 'utf8',
      });

      readableStream.on('error', err => {
        console.error('Error reading file:', err);
      });
      break;

    case 'add':
      const newFile = input.split(' ')[1];
      const newFilePath = pathModule.join(currentPath, newFile);
      await fs.writeFile(newFilePath, '');

      break;

    case 'rn':
      const oldFile = input.split(' ')[1];
      const oldFilePath = pathModule.join(currentPath, oldFile);
      const newFileName = input.split(' ')[2];
      const renamedFile = pathModule.join(currentPath, newFileName);
      await fs.rename(oldFilePath, renamedFile);
      break;

    case 'cp':
      const source = input.split(' ')[1];
      const destination = input.split(' ')[2];
      const fileName = source.split('/').pop();
      const sourcePath = pathModule.join(currentPath, source);
      const destinationPath = pathModule.join(
        currentPath,
        destination,
        fileName
      );
      const readableCopyStream = createReadStream(sourcePath);
      const writableStream = createWriteStream(destinationPath);
      readableCopyStream.pipe(writableStream);
      break;
    case 'mv':
      const sourceFile = input.split(' ')[1];
      const destinationFile = input.split(' ')[2];
      const moveFileName = sourceFile.split('/').pop();
      const sourceFilePath = pathModule.join(currentPath, sourceFile);
      const destinationFilePath = pathModule.join(
        currentPath,
        destinationFile,
        moveFileName
      );
      await fs.rename(sourceFilePath, destinationFilePath);
      break;

    case 'rm':
      const fileToRemove = input.split(' ')[1];
      const fileRemovePath = pathModule.join(currentPath, fileToRemove);
      await fs.unlink(fileRemovePath);
      break;
    case 'os':
      if (input.split(' ')[1] === '--EOL') {
        console.log(os.EOL);
      } else if (input.split(' ')[1] === '--cpus') {
        console.table(os.cpus());
      } else if (input.split(' ')[1] === '--homedir') {
        console.log(os.homedir());
      } else if (input.split(' ')[1] === '--username') {
        console.log(os.userInfo().username);
      } else if (input.split(' ')[1] === '--architecture') {
        console.log(os.arch());
      }
      break;
    case 'hash':
      const fileToHash = input.split(' ')[1];
      const fileHashPath = pathModule.join(currentPath, fileToHash);
      const fileHash = await fs.readFile(fileHashPath, 'utf8');
      const hash = crypto.createHash('sha256').update(fileHash).digest('hex');
      console.log(hash);
      break;

    case 'compress':
      const fileToCompress = input.split(' ')[1];
      const compressDestination = input.split(' ')[2];
      const fileCompressPath = pathModule.join(currentPath, fileToCompress);
      const compressDestinationPath = pathModule.join(
        currentPath,
        compressDestination
      );
      const inputStream = createReadStream(fileCompressPath);
      const brotliStream = zlib.createBrotliCompress();
      const outputStream = createWriteStream(compressDestinationPath + '.br');

      inputStream.pipe(brotliStream).pipe(outputStream);

      inputStream.on('error', err => {
        console.error('Error reading input file:', err);
      });

      brotliStream.on('error', err => {
        console.error('Error compressing file:', err);
      });

      outputStream.on('finish', () => {
        console.log('File compressed successfully.');
      });
      break;
    case 'decompress':
      const fileToDecompress = input.split(' ')[1];
      const decompressDestination = input.split(' ')[2];
      const fileDecompressPath = pathModule.join(currentPath, fileToDecompress);
      const decompressDestinationPath = pathModule.join(
        currentPath,
        decompressDestination
      );
      const compressedStream = fs.createReadStream(fileDecompressPath);
      const brotliDecompressStream = zlib.createBrotliDecompress();
      const outputDecompressStream = fs.createWriteStream(
        decompressDestinationPath
      );

      compressedStream
        .pipe(brotliDecompressStream)
        .pipe(outputDecompressStream);

      compressedStream.on('error', err => {
        console.error('Error reading compressed input file:', err);
      });

      brotliDecompressStream.on('error', err => {
        console.error('Error decompressing file:', err);
      });

      outputDecompressStream.on('finish', () => {
        console.log('File decompressed successfully.');
      });
      break;

    default:
      console.log('Invalid input');
  }

  return currentPath;
};
