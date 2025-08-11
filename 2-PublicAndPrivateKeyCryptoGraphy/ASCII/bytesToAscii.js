function bytesToAscii(bytes){
    return bytes.map(byte => String.fromCharCode(byte)).join('');
}

const bytes = [72, 101, 108, 108, 111]; // ASCII for "Hello"
console.log(bytesToAscii(bytes)); // Outputs: Hello