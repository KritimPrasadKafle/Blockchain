const crypto = require('crypto')
function findHashWithPrefix(prefix){
    let input = 0;
    while(true){
        let inpStr = input.toString();
        let hash = crypto.createHash('sha256').update(inpStr).digest('hex')
        if(hash.startsWith(prefix)){
            return {input: inpStr, hash: hash};
        }
        input++;

    }
}

const result = findHashWithPrefix('00000');
console.log(`input:${result.input}`);
console.log(`Hash:${result.hash}`);

