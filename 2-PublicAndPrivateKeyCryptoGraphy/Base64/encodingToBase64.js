const uint8Array = new Uint8Array([104, 101, 108, 108, 111]);
const base64Encoded = Buffer.from(uint8Array).toString('base64');
console.log(base64Encoded); // Outputs: aGVsbG8=s