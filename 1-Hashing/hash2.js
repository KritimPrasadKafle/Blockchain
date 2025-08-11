// What if I ask you that the input string should start with 100xdevs? How would the code change?

// Import the necessary modules
const { log } = require("console"); // For console logging
const crypto = require("crypto");  // For cryptographic functions like SHA-256

// Function to find an input string whose SHA-256 hash starts with a specific prefisx
function findHashWithPrefix(pre) {
    let input = 0; // Initialize the input value to 0

    while (true) {
        // Step 1: Concatenate the base string "100xdevs" with the current input value converted to a string
        let inputStr = "Kritim send 100$ to Roman " + input.toString(); // This ensures the input string always starts with "100xdevs".
         
        // Step 2: Generate the SHA-256 hash of the input string
        let hash = crypto.createHash('sha256').update(inputStr).digest('hex'); // Convert the string to a hash using SHA-256 algorithm.

        // Step 3: Check if the hash starts with the desired prefix
        if (hash.startsWith(pre)) {
            // Step 4: If the condition is met, return the input and its corresponding hash
            return { input: inputStr, hash: hash }; // Found a match! Return both the input and its hash.
        }

        // Step 5: Log progress every 100,000 iterations for monitoring
        if (input % 100000 === 0) {
            console.log(`Currently at input: ${input}`); // Helpful for tracking progress in long-running operations.
        }

        // Step 6: Increment the input value to test the next possible value
        input++; // Increment the input to try the next value.
    }
}

// Call the function with a prefix of '00000' to find the desired hash
// Note: Start with smaller prefixes like '0' or '00' for faster testing
const res = findHashWithPrefix('0000');

// Log the final result once the input and hash are found
console.log(`Input: ${res.input}`); // Log the input that generated the desired hash.
console.log(`Hashed Result: ${res.hash}`); // Log the hash that starts with the desired prefix.

// Workflow Explanation:
// 1. The function initializes with "input = 0".
// 2. Concatenate "100xdevs" with the current input number to form the string.
// 3. Generate the SHA-256 hash of the concatenated string.
// 4. Check if the hash starts with the specified prefix (e.g., "0000").
// 5. If it does, the function returns the input string and the hash.
// 6. If not, increment the input and repeat the process.
// 7. Logs progress every 100,000 iterations to monitor the process.
// 8. Stops when a matching hash is found and logs the result.