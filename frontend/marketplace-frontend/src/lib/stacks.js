import { openContractCall, getUserData, authenticate } from '@stacks/connect';
import { STACKS_TESTNET } from '@stacks/network'; // Sử dụng STACKS_TESTNET
import { uintCV, stringAsciiCV, fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import axios from 'axios';

// Network configuration
const network = STACKS_TESTNET; // Sử dụng STACKS_TESTNET trực tiếp
const contractAddress = 'ST33SSQ904GZKAJDKYN2GFX9JM5ZBGV3R889DCKY4';
const contractName = 'tame-rose-bass';

// Pinata API credentials for IPFS
const pinataApiKey = process.env.REACT_APP_PINATA_API_KEY || 'dd0389c939f5ddf9d573';
const pinataSecretApiKey = process.env.REACT_APP_PINATA_SECRET_API_KEY || 'ef7b7e4c691f17f6e39ea31a603a686aab55c882daaed2dbd950ffc6c89a53df';

// Check if wallet is already connected
export async function checkWalletConnection() {
  try {
    const userData = await getUserData();
    console.log('User data from getUserData:', userData); // Ghi log để kiểm tra
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
      network,
      onFinish: (data) => {
        console.log('Authentication response (detailed):', JSON.stringify(data, null, 2)); // Ghi log chi tiết
        let address;
        if (data.authResponsePayload && data.authResponsePayload.profile && data.authResponsePayload.profile.stxAddress && data.authResponsePayload.profile.stxAddress.testnet) {
          address = data.authResponsePayload.profile.stxAddress.testnet;
        } else if (data.address) {
          address = data.address; // Fallback cho địa chỉ trực tiếp
        } else {
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
      return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
    } catch (error) {
      console.error('IPFS upload failed:', error);
      throw new Error('Failed to upload to IPFS');
    }
  }
  return `ipfs://mockHash${Date.now()}`; // Fallback for non-file data
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
export async function listProduct(ipfsHash, price, user, name, description, image, quantity, category) {
  let imageHash = image;
  if (image instanceof File) {
    imageHash = await uploadToIPFS(image);
  }
  return new Promise((resolve, reject) => {
    openContractCall({
      network,
      contractAddress,
      contractName,
      functionName: 'list-product',
      functionArgs: [
        uintCV(price),
        stringAsciiCV(imageHash),
        uintCV(quantity),
        stringAsciiCV(category),
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