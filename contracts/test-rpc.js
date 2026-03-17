const { ethers } = require("ethers");

async function checkConfig() {
    const urls = [
        "https://rpc-initia-testnet.trusted-point.com", 
        "https://initia-testnet-rpc.polkachu.com",
    ];
    
    for (const url of urls) {
        try {
            console.log("testing", url);
            const provider = new ethers.JsonRpcProvider(url);
            const net = await provider.getNetwork();
            console.log(`Success ${url}:`, net.name, net.chainId);
        } catch (e) {
            console.log(`Failed ${url}:`, e.message);
        }
    }
}

checkConfig();
