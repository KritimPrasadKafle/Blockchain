const crypto = require('crypto')

const input = 'kritim'
const hash = crypto.createHash('sha256').update(input).digest('hex')

console.log(hash);
