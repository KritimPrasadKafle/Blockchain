import {generateMnemonic} from 'bip39';

//Generate a mnemonic phrase
const mnemonic = generateMnemonic();
console.log('Mnemonic:', mnemonic);