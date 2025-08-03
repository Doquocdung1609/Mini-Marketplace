import { openContractCall, authenticate, AppConfig, UserSession, getUserData } from '@stacks/connect';
import { STACKS_TESTNET } from '@stacks/network';
import { uintCV, stringAsciiCV, fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import axios from 'axios';

// Network configuration
const network = STACKS_TESTNET;
const contractAddress = 'ST33SSQ904GZKAJDKYN2GFX9JM5ZBGV3R889DCKY4';
const contractName = 'tame-rose-bass';

// Pinata API credentials for IPFS
const pinataApiKey = process.env.REACT_APP_PINATA_API_KEY || 'dd9fb52d4047da189cd9';
const pinataSecretApiKey = process.env.REACT_APP_PINATA_SECRET_API_KEY || '23c763c0d64a1d40c30630dab21ea1724cf03c730f8adc68cd0be24c08adca1a';

// AppConfig for Leather
const appConfig = new AppConfig(['store_write', 'publish_data'], 'http://localhost:3000');
const userSession = new UserSession({ appConfig });

// Check if wallet is already connected
export async function checkWalletConnection() {
  try {
    const userData = await getUserData();
    console.log('User data from getUserData:', userData);
    if (userData && userData.profile && userData.profile.stxAddress) {
      return { success: true, address: userData.profile.stxAddress.testnet };
    }
    return { success: false };
  } catch (error) {
    console.error('Error checking wallet connection:', error);
    return { success: false };
  }
}

// Connect wallet
export async function connectWallet() {
  return new Promise((resolve, reject) => {
    authenticate({
      appDetails: {
        name: 'Mini Marketplace',
        icon: window.location.origin + '/logo.svg',
      },
      network: STACKS_TESTNET,
      onFinish: (data) => {
        console.log('Authentication response (detailed):', JSON.stringify(data, null, 2));
        let address = data.authResponsePayload?.profile?.stxAddress?.testnet;
        if (!address) {
          reject(new Error('Invalid authentication response: No valid address found'));
          return;
        }
        localStorage.setItem('stacksAddress', address);
        resolve({ success: true, address });
      },
      onCancel: () => reject(new Error('Wallet connection cancelled by user')),
    });
  });
}

// Upload file to IPFS via Pinata
export async function uploadToIPFS(data) {
  if (data instanceof File) {
    const formData = new FormData();
    formData.append('file', data);
    try {
      const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataSecretApiKey,
        },
      });
      console.log('Pinata response:', response.data);
      if (response.data && response.data.IpfsHash) {
        return response.data.IpfsHash;
      } else {
        throw new Error('Invalid response from Pinata');
      }
    } catch (error) {
      console.error('IPFS upload failed:', error.response ? error.response.data : error.message);
      throw new Error('Failed to upload to IPFS');
    }
  }
  return `ipfs://mockHash${Date.now()}`;
}

// Call read-only contract functions
export async function callReadOnly(functionName, args, userAddress) {
  try {
    const result = await fetchCallReadOnlyFunction({
      network,
      contractAddress,
      contractName,
      functionName,
      functionArgs: args,
      senderAddress: userAddress,
    });
    return cvToJSON(result);
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    throw error;
  }
}

// List a new product
export async function listProduct(ipfsHash, price, quantity, category) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      console.error('Transaction timed out after 120 seconds');
      reject(new Error('Transaction timed out'));
    }, 120000);

    if (!userSession.isUserSignedIn()) {
      reject(new Error('User not signed in. Please connect wallet.'));
      return;
    }

    openContractCall({
      userSession,
      network: STACKS_TESTNET,
      contractAddress,
      contractName,
      functionName: 'list-product',
      functionArgs: [
        uintCV(Number(price) || 0),
        stringAsciiCV(ipfsHash || ''),
        uintCV(Number(quantity) || 0),
        stringAsciiCV(category || ''),
      ],
      appDetails: {
        name: 'Mini Marketplace',
        icon: window.location.origin + '/logo.svg',
      },
      onFinish: (data) => {
        clearTimeout(timeoutId);
        console.log('Transaction finished:', data);
        resolve({ success: true, txId: data.txId });
      },
      onCancel: () => {
        clearTimeout(timeoutId);
        console.log('Transaction cancelled by user');
        reject(new Error('Transaction cancelled by user'));
      },
    });
  });
}

// Buy a product
export async function buyProduct(productId, user) {
  return new Promise((resolve, reject) => {
    openContractCall({
      network,
      contractAddress,
      contractName,
      functionName: 'buy-product',
      functionArgs: [uintCV(productId)],
      appDetails: {
        name: 'Mini Marketplace',
        icon: window.location.origin + '/logo.svg',
      },
      onFinish: async (data) => {
        const downloadLink = `https://gateway.pinata.cloud/ipfs/mockDownload${productId}`;
        resolve({ success: true, txId: data.txId, downloadLink });
      },
      onCancel: () => reject(new Error('Transaction cancelled')),
    });
  });
}

// Unlist a product
export async function unlistProduct(productId, user) {
  return new Promise((resolve, reject) => {
    openContractCall({
      network,
      contractAddress,
      contractName,
      functionName: 'unlist-product',
      functionArgs: [uintCV(productId)],
      appDetails: {
        name: 'Mini Marketplace',
        icon: window.location.origin + '/logo.svg',
      },
      onFinish: (data) => {
        resolve({ success: true, txId: data.txId });
      },
      onCancel: () => reject(new Error('Transaction cancelled')),
    });
  });
}

// Update a product
export async function updateProduct(productId, newIpfsHash, newPrice, user, newQuantity) {
  return new Promise((resolve, reject) => {
    openContractCall({
      network,
      contractAddress,
      contractName,
      functionName: 'update-product',
      functionArgs: [
        uintCV(productId),
        uintCV(newPrice),
        stringAsciiCV(newIpfsHash),
        uintCV(newQuantity),
      ],
      appDetails: {
        name: 'Mini Marketplace',
        icon: window.location.origin + '/logo.svg',
      },
      onFinish: (data) => {
        resolve({ success: true, txId: data.txId });
      },
      onCancel: () => reject(new Error('Transaction cancelled')),
    });
  });
}

// Rate a product
export async function rateProduct(productId, score, user) {
  return new Promise((resolve, reject) => {
    openContractCall({
      network,
      contractAddress,
      contractName,
      functionName: 'rate-product',
      functionArgs: [uintCV(productId), uintCV(score)],
      appDetails: {
        name: 'Mini Marketplace',
        icon: window.location.origin + '/logo.svg',
      },
      onFinish: (data) => {
        resolve({ success: true, txId: data.txId });
      },
      onCancel: () => reject(new Error('Transaction cancelled')),
    });
  });
}

// Get product details
export async function getProduct(productId, userAddress) {
  return callReadOnly('get-product', [uintCV(productId)], userAddress);
}

// Get product owner
export async function getOwner(productId, userAddress) {
  return callReadOnly('get-owner', [uintCV(productId)], userAddress);
}

// Get average rating
export async function getAverageRating(productId, userAddress) {
  return callReadOnly('get-average-rating', [uintCV(productId)], userAddress);
}

// Get transaction history
export async function getTransactionHistory() {
  try {
    const response = await axios.get(`https://api.testnet.hiro.so/extended/v1/address/${contractAddress}.${contractName}/transactions`);
    return response.data.results.map(tx => ({
      id: tx.tx_id,
      productId: tx.contract_call?.function_args?.[0]?.value || 0,
      buyer: tx.sender_address,
      amount: tx.fee_rate || 0,
      timestamp: new Date(tx.burn_block_time_iso).toISOString(),
    }));
  } catch (error) {
    console.error('Failed to fetch transaction history:', error);
    return [];
  }
}

// Delete product (admin only)
export async function deleteProduct(productId, user) {
  return new Promise((resolve, reject) => {
    openContractCall({
      network,
      contractAddress,
      contractName,
      functionName: 'delete-product',
      functionArgs: [uintCV(productId)],
      appDetails: {
        name: 'Mini Marketplace',
        icon: window.location.origin + '/logo.svg',
      },
      onFinish: (data) => {
        resolve({ success: true, txId: data.txId });
      },
      onCancel: () => reject(new Error('Transaction cancelled')),
    });
  });
}