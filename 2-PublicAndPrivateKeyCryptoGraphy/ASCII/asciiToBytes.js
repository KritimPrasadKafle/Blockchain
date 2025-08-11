function asciiToBytes(asciiString){
    const byteArray = [];
    for(let i = 0; i < asciiString.length; i++){
        byteArray.push(asciiString.charCodeAt(i)); // Convert each character to its ASCII value
    }
    return byteArray; // Return the array of ASCII values
}

const asciiString = "Hello"; // Example ASCII string
console.log(asciiToBytes(asciiString)); // Outputs: [72, 101, 108, 108, 111] which are the ASCII values for 'H', 'e