function bytesToAscii(bytes) {
    return new TextDecoder().decode(new Uint8Array(bytes));
}

const bytes = [72, 101, 108, 108, 111]; // ASCII for "Hello"
console.log(bytesToAscii(bytes)); // Outputs: Hello