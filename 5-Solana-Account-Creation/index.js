const solanaweb3 = require('@solana/web3.js')
const fs = require('fs')
const {Keypair, Connection, SystemProgram, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL} = solanaweb3;

const connection = new Connection(solanaweb3.clusterApiUrl('devnet'), 'confirmed');
const dataAccount = Keypair.generate();
const payer = Keypair.generate();

console.log("Generated Payer Public Key:", payer.publicKey.toString());
console.log("Generated Data Account Public Key:", dataAccount.publicKey.toString());

// Helper function to wait for balance to update
async function waitForBalance(publicKey, minBalance, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
        const balance = await connection.getBalance(publicKey);
        console.log(`⏳ Attempt ${i + 1}/${maxAttempts} - Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
        
        if (balance >= minBalance) {
            return balance;
        }
        
        // Wait 2 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error(`Balance did not update after ${maxAttempts} attempts`);
}

// Improved airdrop function with retries
async function requestAirdropWithRetry(publicKey, amount, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🪂 Airdrop attempt ${attempt}/${maxRetries}: Requesting ${amount / LAMPORTS_PER_SOL} SOL...`);
            
            const signature = await connection.requestAirdrop(publicKey, amount);
            console.log(`📝 Airdrop signature: ${signature}`);
            
            // Wait for confirmation with more robust method
            console.log("⏳ Waiting for confirmation...");
            const latestBlockhash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            });
            
            console.log("✅ Airdrop transaction confirmed!");
            
            // Wait for balance to actually update
            console.log("⏳ Waiting for balance to update...");
            const finalBalance = await waitForBalance(publicKey, amount * 0.8); // Allow for small fees
            
            console.log(`✅ Final balance: ${finalBalance / LAMPORTS_PER_SOL} SOL`);
            return finalBalance;
            
        } catch (error) {
            console.log(`❌ Airdrop attempt ${attempt} failed:`, error.message);
            
            if (attempt === maxRetries) {
                throw error;
            }
            
            // Wait before retry
            console.log("⏳ Waiting 5 seconds before retry...");
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

async function createAccount(){
    try {
        // Step 1: Request airdrop with retry logic
        const airdropAmount = 1 * LAMPORTS_PER_SOL; // Request 1 SOL
        await requestAirdropWithRetry(payer.publicKey, airdropAmount);

        // Step 2: Double-check balance before proceeding
        const balance = await connection.getBalance(payer.publicKey);
        console.log(`\n💰 Current payer balance: ${balance / LAMPORTS_PER_SOL} SOL`);
        
        if (balance === 0) {
            throw new Error("Payer account still has 0 balance. Airdrop may have failed.");
        }

        // Step 3: Calculate rent exempt amount
        console.log("\n🏗️  Preparing to create new account...");
        const rentExemptAmount = await connection.getMinimumBalanceForRentExemption(1000);
        console.log(`💰 Rent exempt amount needed: ${rentExemptAmount / LAMPORTS_PER_SOL} SOL`);
        
        if (balance < rentExemptAmount) {
            throw new Error(`Insufficient balance. Need ${rentExemptAmount / LAMPORTS_PER_SOL} SOL but have ${balance / LAMPORTS_PER_SOL} SOL`);
        }

        // Step 4: Create the transaction
        const transaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: payer.publicKey,
                newAccountPubkey: dataAccount.publicKey,
                lamports: rentExemptAmount,
                space: 1000,
                programId: SystemProgram.programId,
            })
        );
        
        // Step 5: Send and confirm transaction
        console.log("📤 Sending create account transaction...");
        const txId = await sendAndConfirmTransaction(
            connection, 
            transaction, 
            [payer, dataAccount],
            {
                commitment: 'confirmed',
                skipPreflight: false,
                preflightCommitment: 'processed'
            }
        );
        
        console.log(`✅ Account created successfully!`);
        console.log(`🔗 Transaction ID: ${txId}`);
        console.log(`🆔 New Account Public Key: ${dataAccount.publicKey.toString()}`);
        
        // Step 6: Verify the account was created
        console.log("\n🔍 Verifying account...");
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        
        const accountInfo = await connection.getAccountInfo(dataAccount.publicKey);
        if (accountInfo) {
            console.log(`✅ Account verified!`);
            console.log(`   - Balance: ${accountInfo.lamports / LAMPORTS_PER_SOL} SOL`);
            console.log(`   - Space: ${accountInfo.data.length} bytes`);
            console.log(`   - Owner: ${accountInfo.owner.toString()}`);
            console.log(`   - Executable: ${accountInfo.executable}`);
        } else {
            console.log("⚠️  Account info not found immediately, but transaction was successful");
        }

        // Step 7: Save keypairs to files for future use
        console.log("\n💾 Saving keypairs to files...");
        saveKeypairToFile(payer, 'payer-keypair.json');
        saveKeypairToFile(dataAccount, 'data-account-keypair.json');
        
        // Step 8: Show final balances
        const finalPayerBalance = await connection.getBalance(payer.publicKey);
        console.log(`\n💰 Final payer balance: ${finalPayerBalance / LAMPORTS_PER_SOL} SOL`);
        
    } catch (error) {
        console.error("\n❌ Error creating account:", error.message);
        
        // Enhanced error handling
        if (error.message.includes('airdrop')) {
            console.log("💡 Tip: Devnet airdrops might be rate-limited. Try:");
            console.log("   1. Wait a few minutes and try again");
            console.log("   2. Use a different RPC endpoint");
            console.log("   3. Try requesting a smaller amount");
        } else if (error.message.includes('Insufficient balance')) {
            console.log("💡 Tip: The account doesn't have enough SOL for the transaction");
        } else if (error.message.includes('Simulation failed')) {
            console.log("💡 Tip: Transaction simulation failed, possibly due to insufficient funds");
        }
        
        throw error;
    }
}

// Helper function to save keypair to file
function saveKeypairToFile(keypair, filename) {
    const secretKeyArray = Array.from(keypair.secretKey);
    fs.writeFileSync(filename, JSON.stringify(secretKeyArray, null, 2));
    console.log(`💾 Keypair saved to ${filename}`);
}

// Helper function to load keypair from file (for future use)
function loadKeypairFromFile(filename) {
    try {
        const secretKeyArray = JSON.parse(fs.readFileSync(filename, 'utf8'));
        return Keypair.fromSecretKey(new Uint8Array(secretKeyArray));
    } catch (error) {
        console.log(`❌ Could not load keypair from ${filename}:`, error.message);
        return null;
    }
}

// Run the account creation with better error handling
createAccount().then(() => {
    console.log("\n🎉 Account creation process completed successfully!");
}).catch(error => {
    console.error("\n💥 Account creation failed:", error.message);
    process.exit(1);
});