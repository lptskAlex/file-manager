import readline from 'readline';

import os from 'os';
import { handleInput } from './handleInput.js';

export const readLine = async () => {
  const homeDir = os.homedir();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  let currentPath = homeDir;
  async function processUserInput(input) {
    currentPath = await handleInput(input, currentPath);
    rl.question(`You are currently in ${currentPath}\n`, processUserInput);
  }
  const args = process.argv.slice(2);
  const username = args[0].split('=')[1];

  rl.write(`Welcome to the File Manager, ${username}\n`);
  rl.question(`You are currently in ${currentPath}\n`, processUserInput);

  rl.on('close', () => {
    console.log(`Thank you for using File Manager, ${username}, goodbye!`);
    process.exit(0);
  });
};
