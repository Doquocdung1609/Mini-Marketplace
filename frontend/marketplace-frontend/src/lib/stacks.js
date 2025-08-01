import { openContractCall } from '@stacks/connect';
import { STACKS_TESTNET } from '@stacks/network'; // Chỉ sử dụng STACKS_TESTNET
import { 
  uintCV, 
  stringUtf8CV, 
  cvToJSON,
  fetchCallReadOnlyFunction, // Sử dụng fetchCallReadOnlyFunction
} from '@stacks/transactions';
import axios from 'axios';

// Cấu hình mạng (sử dụng testnet)
const network = STACKS_TESTNET; // Sử dụng trực tiếp STACKS_TESTNET
const contractAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'; // Thay bằng địa chỉ deployer
const contractName = 'marketplace';
const explorerApi = 'https://api.testnet.stacks.co/extended/v1';
const pinataApiKey = 'c51d36141a1da34c7a91'; // Thay bằng API Key của bạn
const pinataSecretApiKey = '6dc64c7882065fc575596d7476d4d7e7e73f4ac55214bcef18794dc7b72105e6'; // Thay bằng Secret API Key

// Hàm upload file lên IPFS qua Pinata
export async function uploadToIPFS(file) {
  const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(url, formData, {
      headers: {
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretApiKey,
        'Content-Type': 'multipart/form-data',
      },
    });
    return `ipfs://${response.data.IpfsHash}`;
  } catch (error) {
    console.error('IPFS upload failed:', error);
    throw new Error('Failed to upload to IPFS');
  }
}

// Hàm kết nối Leather Wallet
export async function connectWallet() {
  return new Promise((resolve, reject) => {
    openContractCall({
      network,
      contractAddress,
      contractName,
      functionName: 'get-product',
      functionArgs: [uintCV(0)],
      onFinish: (data) => resolve(data),
      onCancel: () => reject(new Error('User cancelled wallet connection')),
    });
  });
}

// Hàm gọi read-only function
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
    console.error(`Call read-only failed for ${functionName}:`, error);
    throw error;
  }
}

// Hàm đăng sản phẩm
export async function listProduct(ipfsHash, price, user) {
  return new Promise((resolve, reject) => {
    openContractCall({
      network,
      contractAddress,
      contractName,
      functionName: 'list-product',
      functionArgs: [
        stringUtf8CV(ipfsHash),
        uintCV(price),
      ],
      onFinish: (data) => resolve(data),
      onCancel: () => reject(new Error('Transaction cancelled')),
      senderAddress: user.stacksAddress,
    });
  });
}

// Các hàm khác (buyProduct, unlistProduct, updateProduct, rateProduct, getProduct, getOwner, getAverageRating, getTransactionHistory) giữ nguyên
export async function buyProduct(productId, user) {
  return new Promise((resolve, reject) => {
    openContractCall({
      network,
      contractAddress,
      contractName,
      functionName: 'buy-product',
      functionArgs: [uintCV(productId)],
      onFinish: (data) => resolve(data),
      onCancel: () => reject(new Error('Transaction cancelled')),
      senderAddress: user.stacksAddress,
    });
  });
}

export async function unlistProduct(productId, user) {
  return new Promise((resolve, reject) => {
    openContractCall({
      network,
      contractAddress,
      contractName,
      functionName: 'unlist-product',
      functionArgs: [uintCV(productId)],
      onFinish: (data) => resolve(data),
      onCancel: () => reject(new Error('Transaction cancelled')),
      senderAddress: user.stacksAddress,
    });
  });
}

export async function updateProduct(productId, newIpfsHash, newPrice, user) {
  return new Promise((resolve, reject) => {
    openContractCall({
      network,
      contractAddress,
      contractName,
      functionName: 'update-product',
      functionArgs: [
        uintCV(productId),
        stringUtf8CV(newIpfsHash),
        uintCV(newPrice),
      ],
      onFinish: (data) => resolve(data),
      onCancel: () => reject(new Error('Transaction cancelled')),
      senderAddress: user.stacksAddress,
    });
  });
}

export async function rateProduct(productId, score, user) {
  return new Promise((resolve, reject) => {
    openContractCall({
      network,
      contractAddress,
      contractName,
      functionName: 'rate-product',
      functionArgs: [
        uintCV(productId),
        uintCV(score),
      ],
      onFinish: (data) => resolve(data),
      onCancel: () => reject(new Error('Transaction cancelled')),
      senderAddress: user.stacksAddress,
    });
  });
}

export async function getProduct(productId, userAddress) {
  return callReadOnly('get-product', [uintCV(productId)], userAddress);
}

export async function getOwner(productId, userAddress) {
  return callReadOnly('get-owner', [uintCV(productId)], userAddress);
}

export async function getAverageRating(productId, userAddress) {
  return callReadOnly('get-average-rating', [uintCV(productId)], userAddress);
}

export async function getTransactionHistory() {
  try {
    const response = await fetch(
      `${explorerApi}/contract/${contractAddress}.${contractName}/events?limit=50`
    );
    const data = await response.json();
    return data.events.filter(event => event.event_type === 'print_event');
  } catch (error) {
    console.error('Failed to fetch transaction history:', error);
    return [];
  }
}