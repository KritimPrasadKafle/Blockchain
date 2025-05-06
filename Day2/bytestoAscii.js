function bytesToAscii(byteArray){
    return byteArray.map(byte => String.fromCharCode(byte)).join('');
}
const bytes = [72,101,108,108,111];
const asciiString = bytesToAscii(bytes);
console.log(asciiString);
