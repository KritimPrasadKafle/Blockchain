const { createMint, getOrCreateAssociatedTokenAccount, mintTo } = require('@solana/spl-token');
const { Keypair, Connection, clusterApiUrl, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

// Your payer keypair
const payer = Keypair.fromSecretKey(Uint8Array.from([102,144,169,42,220,87,99,85,100,128,197,17,41,234,250,84,87,98,161,74,15,249,83,6,120,159,135,22,46,164,204,141,234,217,146,214,61,187,254,97,124,111,61,29,54,110,245,186,11,253,11,127,213,20,73,8,25,201,22,107,4,75,26,120]));

// Fixed typo: mintAuthority (not mintAthority)
const mintAuthority = payer;

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

console.log('🔑 Payer Public Key:', payer.publicKey.toString());
console.log('🔑 Mint Authority:', mintAuthority.publicKey.toString());

// Function to ensure payer has enough balance
async function ensureBalance() {
    const balance = await connection.getBalance(payer.publicKey);
    console.log(`💰 Current balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    
    if (balance < 0.1 * LAMPORTS_PER_SOL) {
        console.log('🪂 Requesting airdrop...');
        try {
            const signature = await connection.requestAirdrop(
                payer.publicKey,
                2 * LAMPORTS_PER_SOL
            );
            
            const latestBlockhash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            });
            
            const newBalance = await connection.getBalance(payer.publicKey);
            console.log(`✅ Airdrop successful! New balance: ${newBalance / LAMPORTS_PER_SOL} SOL`);
        } catch (error) {
            console.error('❌ Airdrop failed:', error.message);
            throw error;
        }
    }
}

async function createMintForToken(payer, mintAuthorityPublicKey) {
    try {
        console.log('\n🪙 Creating mint...');
        const mint = await createMint(
            connection,
            payer,                    // Fee payer
            mintAuthorityPublicKey,   // Mint authority
            null,                     // Freeze authority (null = no freeze authority)
            6                         // Decimals (removed TOKEN_PROGRAM_ID - it's default)
        );
        
        console.log('✅ Mint created at:', mint.toString());
        return mint;
    } catch (error) {
        console.error('❌ Error creating mint:', error.message);
        throw error;
    }
}

async function mintNewTokens(mint, toPublicKey, amount) {
    try {
        console.log('\n🏦 Creating/getting associated token account...');
        
        const tokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer,           // Fee payer
            mint,            // Mint address
            toPublicKey      // Owner of the token account
        );
        
        console.log('✅ Token account created/found at:', tokenAccount.address.toString());
        
        // Calculate amount with decimals (6 decimals in this case)
        const mintAmount = amount * Math.pow(10, 6);
        
        console.log(`🔨 Minting ${amount} tokens (${mintAmount} with decimals)...`);
        
        const signature = await mintTo(
            connection,
            payer,                    // Fee payer
            mint,                     // Mint address
            tokenAccount.address,     // Destination token account
            mintAuthority,            // Mint authority (the keypair, not public key)
            mintAmount               // Amount to mint (with decimals)
        );
        
        console.log('✅ Minted', amount, 'tokens to', tokenAccount.address.toString());
        console.log('🔗 Mint transaction:', signature);
        
        // Verify the mint worked
        console.log('\n🔍 Verifying token account...');
        const accountInfo = await connection.getTokenAccountBalance(tokenAccount.address);
        console.log(`💰 Token account balance: ${accountInfo.value.uiAmount} tokens`);
        
        return {
            tokenAccount: tokenAccount.address,
            signature,
            balance: accountInfo.value.uiAmount
        };
        
    } catch (error) {
        console.error('❌ Error minting tokens:', error.message);
        throw error;
    }
}

async function main() {
    try {
        console.log('🚀 Starting token creation and minting...\n');
        
        // Step 1: Ensure we have enough SOL
        await ensureBalance();
        
        // Step 2: Create the mint
        const mint = await createMintForToken(payer, mintAuthority.publicKey);
        
        // Step 3: Mint tokens to the authority's account
        const result = await mintNewTokens(mint, mintAuthority.publicKey, 100);
        
        console.log('\n🎉 SUCCESS! Token minting completed!');
        console.log('\n📋 SUMMARY:');
        console.log(`🆔 Mint Address: ${mint.toString()}`);
        console.log(`🏦 Token Account: ${result.tokenAccount.toString()}`);
        console.log(`💰 Tokens Minted: ${result.balance}`);
        console.log(`🔑 Owner: ${mintAuthority.publicKey.toString()}`);
        
        
    } catch (error) {
        console.error('\n💥 Token creation failed:', error.message);
        process.exit(1);
    }
}

// Run the main function
main();