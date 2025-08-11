import {generateMnemonic, mnemonicToSeedSync} from 'bip39';

const mnemonic = generateMnemonic();
console.log('Mnemonic:', mnemonic);
const seed = mnemonicToSeedSync(mnemonic);
console.log('Seed:', seed.toString('hex'));