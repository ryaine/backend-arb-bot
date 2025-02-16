const express = require('express');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();

// Read the port from the environment variable or use a default value
const port = process.env.PORT || 3000; // Default to 3000 if PORT is not set
console.log('Server will run on port:', port);

app.use(express.json());

// Initialize Ethers.js provider for BNB Chain
const provider = new ethers.providers.JsonRpcProvider(process.env.BNB_CHAIN_NODE_URL);
console.log('Provider initialized for BNB Chain:', process.env.BNB_CHAIN_NODE_URL);

// Load the wallet using the private key from environment variables
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
console.log('Wallet initialized with address:', wallet.address);

// Load the contract ABI and address from environment variables
const contractABI = JSON.parse(process.env.CONTRACT_ABI);
const contractAddress = process.env.CONTRACT_ADDRESS;
console.log('Contract ABI loaded:', contractABI);
console.log('Contract address:', contractAddress);

// Endpoint to execute a trade
app.post('/execute-trade', async (req, res) => {
    const { tokenIn, tokenOut, flashloanAmt } = req.body;
    console.log('Received request to execute trade:', { tokenIn, tokenOut, flashloanAmt });

    try {
        // Connect to the contract
        const contract = new ethers.Contract(contractAddress, contractABI, wallet);
        console.log('Connected to contract');

        // Execute the trade
        console.log('Sending transaction to execute trade...');
        const tx = await contract.executeTrade(tokenIn, tokenOut, flashloanAmt);
        console.log('Transaction sent. Transaction hash:', tx.hash);

        // Wait for the transaction to be mined
        console.log('Waiting for transaction to be mined...');
        const receipt = await tx.wait();
        console.log('Transaction mined. Receipt:', receipt);

        res.json({ success: true, transactionHash: tx.hash, receipt });
    } catch (error) {
        console.error('Error executing trade:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});