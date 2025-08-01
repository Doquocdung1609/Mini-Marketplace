import React, { useState, useEffect } from 'react';
import { UserSession } from '@stacks/connect';
import { connectWallet, listProduct, buyProduct, unlistProduct, updateProduct, rateProduct, getProduct, getAverageRating, getTransactionHistory } from './lib/stacks';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import ProductDetails from './components/ProductDetails';
import TransactionHistory from './components/TransactionHistory';
import './App.css';

function App() {
  const userSession = new UserSession();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null); // Thêm state để xử lý lỗi

  // Kết nối ví Leather
  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      if (userSession.isUserSignedIn()) {
        setUser(userSession.loadUserData());
        setError(null); // Xóa lỗi khi kết nối thành công
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setError('Failed to connect wallet. Please try again.');
    }
  };

  // Lấy danh sách sản phẩm
  const fetchProducts = async () => {
    try {
      const productList = [];
      for (let id = 1; id <= 10; id++) {
        try {
          const product = await getProduct(id, user?.stacksAddress || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
          if (product.value) {
            const avgRating = await getAverageRating(id, user?.stacksAddress || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
            productList.push({ id, ...product.value, avgRating: avgRating.value });
          }
        } catch (error) {
          console.log(`Product ${id} not found`);
        }
      }
      setProducts(productList);
      setError(null); // Xóa lỗi khi fetch thành công
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setError('Failed to load products. Check console for details.');
    }
  };

  // Lấy lịch sử giao dịch
  const fetchTransactions = async () => {
    try {
      const txs = await getTransactionHistory();
      setTransactions(txs);
      setError(null); // Xóa lỗi khi fetch thành công
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setError('Failed to load transactions. Check console for details.');
    }
  };

  // Xử lý đăng sản phẩm
  const handleListProduct = async (ipfsHash, price) => {
    try {
      await listProduct(ipfsHash, price, user);
      await fetchProducts();
      await fetchTransactions();
      setError(null); // Xóa lỗi khi thành công
    } catch (error) {
      console.error('List product failed:', error);
      setError('Failed to list product. Check console for details.');
    }
  };

  // Các hàm khác (handleBuyProduct, handleUnlistProduct, handleUpdateProduct, handleRateProduct) giữ nguyên với xử lý lỗi
  const handleBuyProduct = async (productId) => {
    try {
      await buyProduct(productId, user);
      await fetchProducts();
      await fetchTransactions();
      setError(null);
    } catch (error) {
      console.error('Buy product failed:', error);
      setError('Failed to buy product. Check console for details.');
    }
  };

  const handleUnlistProduct = async (productId) => {
    try {
      await unlistProduct(productId, user);
      await fetchProducts();
      await fetchTransactions();
      setError(null);
    } catch (error) {
      console.error('Unlist product failed:', error);
      setError('Failed to unlist product. Check console for details.');
    }
  };

  const handleUpdateProduct = async (productId, newIpfsHash, newPrice) => {
    try {
      await updateProduct(productId, newIpfsHash, newPrice, user);
      await fetchProducts();
      await fetchTransactions();
      setError(null);
    } catch (error) {
      console.error('Update product failed:', error);
      setError('Failed to update product. Check console for details.');
    }
  };

  const handleRateProduct = async (productId, score) => {
    try {
      await rateProduct(productId, score, user);
      await fetchProducts();
      await fetchTransactions();
      setError(null);
    } catch (error) {
      console.error('Rate product failed:', error);
      setError('Failed to rate product. Check console for details.');
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchTransactions();
    }
  }, [user, fetchProducts]);

  return (
    <div className="App">
      <h1>Mini Marketplace for Digital Goods</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>} {/* Hiển thị lỗi */}
      {!user ? (
        <button onClick={handleConnectWallet}>Connect Leather Wallet</button>
      ) : (
        <div>
          <p>Connected: {user.stacksAddress}</p>
          <ProductForm onListProduct={handleListProduct} />
          <ProductList 
            products={products} 
            userAddress={user.stacksAddress}
            onBuyProduct={handleBuyProduct}
            onUnlistProduct={handleUnlistProduct}
            onSelectProduct={setSelectedProduct}
          />
          {selectedProduct && (
            <ProductDetails 
              product={selectedProduct}
              userAddress={user.stacksAddress}
              onUpdateProduct={handleUpdateProduct}
              onRateProduct={handleRateProduct}
            />
          )}
          <TransactionHistory transactions={transactions} />
        </div>
      )}
    </div>
  );
}

export default App;