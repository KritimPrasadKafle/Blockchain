const x = 202;
console.log(x);


const bytes = [202,244,1,3]
console.log(bytes);

let bytes2 = new Uint8Array([0,255,127,128]);

console.log(bytes2);


const binaryRepresentation = new TextEncoder().encode('h');
console.log(binaryRepresentation);

let uint8Arr = new Uint8Array([0, 255, 127, 128]);
uint8Arr[1] = 300;
console.log(uint8Arr);
