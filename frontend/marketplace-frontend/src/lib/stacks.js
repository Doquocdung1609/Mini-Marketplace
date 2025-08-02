import { openContractCall } from '@stacks/connect';
import { STACKS_TESTNET } from '@stacks/network';
import { uintCV, stringUtf8CV, cvToJSON } from '@stacks/transactions';
import axios from 'axios';

// Mock data
let mockProducts = [
  { 
    id: 1, 
    name: "Digital Art #1", 
    ipfsHash: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco", 
    price: 1000000, 
    owner: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM", 
    description: "A beautiful digital artwork", 
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?fit=crop&w=150&h=150", 
    quantity: 10, 
    sold: 2, 
    revenue: 2000000, 
    category: "Ebook"
  },
  { 
    id: 2, 
    name: "NFT Music Track", 
    ipfsHash: "QmYoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco", 
    price: 500000, 
    owner: "ST2X1ABCDEF1234567890ZYXWVUTSRQPON", 
    description: "High-quality music track", 
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?fit=crop&w=150&h=150",
    quantity: 5, 
    sold: 1, 
    revenue: 500000,
    category: "Photos"
  },
  { 
    id: 3, 
    name: "Virtual Item", 
    ipfsHash: "QmZoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco", 
    price: 750000, 
    owner: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM", 
    description: "Virtual game item", 
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?fit=crop&w=150&h=150",
    quantity: 8, 
    sold: 0, 
    revenue: 0,
    category: "Templates" 
  },
  { 
    id: 4, 
    name: "NFT Music Track", 
    ipfsHash: "QmYoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco", 
    price: 500000, 
    owner: "ST2X1ABCDEF1234567890ZYXWVUTSRQPON", 
    description: "High-quality music track", 
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?fit=crop&w=150&h=150",
    quantity: 5, 
    sold: 1, 
    revenue: 500000,
    category: "Templates" 
  },
  { 
    id: 5, 
    name: "Virtual Item", 
    ipfsHash: "QmZoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco", 
    price: 750000, 
    owner: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM", 
    description: "Virtual game item", 
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?fit=crop&w=150&h=150",
    quantity: 8, 
    sold: 0, 
    revenue: 0,
    category: "Templates"
  },
];

const mockRatings = { 1: 4.5, 2: 3.8, 3: 4.2 };
const mockTransactions = [
  { id: 1, productId: 1, buyer: "ST2X1ABCDEF1234567890ZYXWVUTSRQPON", amount: 1000000, timestamp: "2025-07-31T10:00:00Z" },
  { id: 2, productId: 2, buyer: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM", amount: 500000, timestamp: "2025-07-31T12:00:00Z" },
];
let downloadLinks = {};

const network = STACKS_TESTNET;
const contractAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const contractName = 'marketplace';
const explorerApi = 'https://api.testnet.stacks.co/extended/v1';
const pinataApiKey = 'c51d36141a1da34c7a91';
const pinataSecretApiKey = '6dc64c7882065fc575596d7476d4d7e7e73f4ac55214bcef18794dc7b72105e6';

export async function uploadToIPFS(data) {
  if (data instanceof File) {
    const formData = new FormData();
    formData.append('image', data);
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    const response = await axios.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretApiKey
      }
    });
    return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
  } else {
    return `ipfs://mockHash${Date.now()}`; // Giả lập cho string
  }
}

export async function connectWallet() {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true, address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' }), 500);
  });
}

export async function callReadOnly(functionName, args, userAddress) {
  if (functionName === 'get-product') {
    const productId = args[0].value;
    return { value: mockProducts.find(p => p.id === productId) || null };
  } else if (functionName === 'get-average-rating') {
    const productId = args[0].value;
    return { value: mockRatings[productId] || 0 };
  }
  return { value: null };
}

export async function listProduct(ipfsHash, price, user, name, description, image, quantity, category) {
  return new Promise((resolve) => {
    setTimeout(async () => {
      let imageHash = image;
      if (image instanceof File) {
        imageHash = await uploadToIPFS(image);
      }
      const newProduct = { id: mockProducts.length + 1, name, ipfsHash, price, owner: user.stacksAddress, description, image: imageHash, quantity, sold: 0, revenue: 0, category };
      mockProducts.push(newProduct);
      resolve({ success: true });
    }, 500);
  });
}

export async function buyProduct(productId, user) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const product = mockProducts.find(p => p.id === productId && p.quantity > 0);
      if (product) {
        product.quantity -= 1;
        product.sold += 1;
        product.revenue += product.price;
        mockTransactions.push({ id: mockTransactions.length + 1, productId, buyer: user.stacksAddress, amount: product.price, timestamp: new Date().toISOString() });
        downloadLinks[productId] = `https://example.com/download/${productId}`;
        resolve({ success: true, downloadLink: downloadLinks[productId] });
      } else {
        resolve({ success: false, error: "Out of stock or purchase failed" });
      }
    }, 500);
  });
}

export async function unlistProduct(productId, user) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const index = mockProducts.findIndex(p => p.id === productId && p.owner === user.stacksAddress);
      if (index !== -1) {
        mockProducts.splice(index, 1);
        resolve({ success: true });
      } else {
        resolve({ success: false });
      }
    }, 500);
  });
}

export async function updateProduct(productId, newIpfsHash, newPrice, user, newQuantity, newCategory) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const product = mockProducts.find(p => p.id === productId && p.owner === user.stacksAddress);
      if (product) {
        product.ipfsHash = newIpfsHash;
        product.price = newPrice;
        product.quantity = newQuantity;
        product.category = newCategory;
        resolve({ success: true });
      } else {
        resolve({ success: false });
      }
    }, 500);
  });
}

export async function rateProduct(productId, score, user) {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockRatings[productId] = score;
      resolve({ success: true });
    }, 500);
  });
}

export async function getProduct(productId, userAddress) {
  return callReadOnly('get-product', [uintCV(productId)], userAddress);
}

export async function getOwner(productId, userAddress) {
  const product = mockProducts.find(p => p.id === productId);
  return { value: product ? product.owner : null };
}

export async function getAverageRating(productId, userAddress) {
  return callReadOnly('get-average-rating', [uintCV(productId)], userAddress);
}

export async function getTransactionHistory() {
  return mockTransactions;
}

export async function deleteProduct(productId, user) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (user.stacksAddress === 'ST3ADMIN1234567890ZYXWVUTSRQPONMLKJ') {
        const index = mockProducts.findIndex(p => p.id === productId);
        if (index !== -1) {
          mockProducts.splice(index, 1);
          resolve({ success: true });
        } else {
          resolve({ success: false });
        }
      } else {
        resolve({ success: false, error: "Only admin can delete" });
      }
    }, 500);
  });
}

export { mockProducts, mockRatings, downloadLinks };