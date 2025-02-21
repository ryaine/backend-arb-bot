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
    const { tokenIn, tokenOut, flashloanAmt, gasLimit } = req.body;
    console.log('Received request to execute trade:', { tokenIn, tokenOut, flashloanAmt, gasLimit });

    try {
        // Connect to the contract
        const contract = new ethers.Contract(contractAddress, contractABI, wallet);
        console.log('Connected to contract');

        // Prepare the parameters for initiateArbitrage
        const assets = [tokenIn]; // Array of token addresses
        const amounts = [flashloanAmt]; // Array of amounts (in wei)
        const params = ethers.utils.defaultAbiCoder.encode(
            ['address', 'address'], // Encode tokenIn and tokenOut as bytes
            [tokenIn, tokenOut]
        );

        // Set a manual gas limit if gas estimation fails
        let manualGasLimit = gasLimit || 5000000; // Default to 5,000,000 gas if not provided

        // Execute the arbitrage
        console.log('Sending transaction to initiate arbitrage...');
        const tx = await contract.initiateArbitrage(assets, amounts, params, manualGasLimit, {
            gasLimit: manualGasLimit, // Use the manual gas limit
        });
        console.log('Transaction sent. Transaction hash:', tx.hash);

        // Wait for the transaction to be mined
        console.log('Waiting for transaction to be mined...');
        const receipt = await tx.wait();
        console.log('Transaction mined. Receipt:', receipt);

        // Check if the transaction was successful
        if (receipt.status === 0) {
            throw new Error('Transaction reverted: Flash loan failed');
        }

        res.json({ success: true, transactionHash: tx.hash, receipt });
    } catch (error) {
        console.error('Error executing trade:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
