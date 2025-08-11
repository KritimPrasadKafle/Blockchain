function asciiToBytes(ascii){
    return new Uint8Array([...ascii].map(char => char.charCodeAt(0)));
}

const asciiString = "Hello"; // Example ASCII string
console.log(asciiToBytes(asciiString)); // Outputs: Uint8Array(5) [72, 101, 108, 108, 111] which are the ASCII values