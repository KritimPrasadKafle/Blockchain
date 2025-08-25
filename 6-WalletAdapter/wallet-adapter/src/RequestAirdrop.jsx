import {useWallet} from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

function RequestAirdrop(){
    const wallet = useWallet();

    const {connection} = useConnection();

    async function requestAirdrop(){
        let amount = document.getElementById("amount").value;
        await connection.requestAirdrop(wallet.publicKey, amount*LAMPORTS_PER_SOL);
        alert("Airdropped " + amount + " SOL to " + wallet.publicKey.toBase58());

    }

    return <div>

        <br />
        <br />
        <input type="text" placeholder="Amount" id = "amount" />
        <button onClick={requestAirdrop}>Request Airdrop</button>
    </div>
}

export default RequestAirdrop;