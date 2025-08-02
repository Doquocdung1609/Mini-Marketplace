import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation, Link } from 'react-router-dom';
import { connectWallet, listProduct, buyProduct, unlistProduct, updateProduct, rateProduct, getTransactionHistory, deleteProduct, mockProducts, mockRatings, downloadLinks } from './lib/stacks';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import TransactionHistory from './components/TransactionHistory';
import SellerProductManagement from './components/SellerProductManagement';
import ProductDetailPage from './components/ProductDetailPage';
import './App.css';

const AppContent = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(localStorage.getItem('role') || '');
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const location = useLocation();

  const handleConnectWallet = async () => {
    try {
      const result = await connectWallet();
      if (result.success) {
        setUser({ stacksAddress: result.address });
        setError(null);
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 3000);
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setError('Failed to connect wallet.');
    }
  };

  const fetchProducts = async () => {
    try {
      const productList = mockProducts.map(product => {
        const avgRating = mockRatings[product.id] || 0;
        return { id: product.id, ...product, avgRating };
      });
      setProducts(productList || []);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setError('Failed to load products.');
    }
  };

  const fetchTransactions = async () => {
    try {
      const txs = await getTransactionHistory();
      setTransactions(txs);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setError('Failed to load transactions.');
    }
  };

  const handleListProduct = async (ipfsHash, price, name, description, image, quantity) => {
    try {
      await listProduct(ipfsHash, price, user, name, description, image, quantity);
      await fetchProducts();
      await fetchTransactions();
      setError(null);
    } catch (error) {
      console.error('List product failed:', error);
      setError('Failed to list product.');
    }
  };

  const handleBuyProduct = async (productId) => {
    try {
      const result = await buyProduct(productId, user);
      if (result.success) {
        setPaymentStatus('success');
        setShowPaymentPopup(true);
        await fetchProducts();
        await fetchTransactions();
      } else {
        setPaymentStatus('fail');
        setShowPaymentPopup(true);
      }
      setTimeout(() => setShowPaymentPopup(false), 3000);
    } catch (error) {
      console.error('Buy product failed:', error);
      setError('Failed to buy product.');
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
      setError('Failed to unlist product.');
    }
  };

  const handleUpdateProduct = async (productId, newIpfsHash, newPrice, newQuantity) => {
    try {
      await updateProduct(productId, newIpfsHash, newPrice, user, newQuantity);
      await fetchProducts();
      await fetchTransactions();
      setError(null);
    } catch (error) {
      console.error('Update product failed:', error);
      setError('Failed to update product.');
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
      setError('Failed to rate product.');
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await deleteProduct(productId, user);
      await fetchProducts();
      await fetchTransactions();
      setError(null);
    } catch (error) {
      console.error('Delete product failed:', error);
      setError('Only admin can delete products.');
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchTransactions();
    }
  }, [user]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const productsPerPage = 25;
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center max-w-7xl">
          <h1 className="text-3xl font-bold">Mini Marketplace</h1>
          {user && (
            <nav className="space-x-4">
              <Link to="/" className="hover:text-gray-200">Home</Link>
              {role === 'seller' && <Link to="/seller" className="hover:text-gray-200">Seller</Link>}
              {role === 'admin' && <Link to="/admin" className="hover:text-gray-200">Admin</Link>}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar (ẩn khi chưa đăng nhập) */}
        {user && (
          <aside className="w-64 bg-white p-6 shadow-lg flex flex-col min-h-[calc(100vh-128px)]">
            <nav className="flex-1">
              <ul className="space-y-4">
                <li><Link to="/" className="text-blue-600 hover:text-blue-800 font-medium">Home</Link></li>
                {role === 'seller' && <li><Link to="/seller" className="text-blue-600 hover:text-blue-800 font-medium">Seller Dashboard</Link></li>}
                {role === 'admin' && <li><Link to="/admin" className="text-blue-600 hover:text-blue-800 font-medium">Admin Panel</Link></li>}
              </ul>
            </nav>
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {!user ? (
            <div className="max-w-md mx-auto mt-12 p-8 bg-white rounded-xl shadow-2xl">
              <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">Select Your Role</h2>
              <div className="space-y-4">
                <button
                  onClick={() => { setRole('buyer'); handleConnectWallet(); }}
                  className="w-full bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition transform hover:scale-105"
                >
                  Buyer
                </button>
                <button
                  onClick={() => { setRole('seller'); handleConnectWallet(); }}
                  className="w-full bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition transform hover:scale-105"
                >
                  Seller
                </button>
                <button
                  onClick={() => { setRole('admin'); handleConnectWallet(); }}
                  className="w-full bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition transform hover:scale-105"
                >
                  Admin
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* <p className="text-gray-700 mb-4">Connected: {user.stacksAddress} (Role: {role})</p> */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {role === 'seller' && (
                <>
                  <ProductForm onListProduct={handleListProduct} userAddress={user.stacksAddress} />
                  <SellerProductManagement
                    products={products.filter(p => p.owner === user.stacksAddress)}
                    onUnlistProduct={handleUnlistProduct}
                    onUpdateProduct={handleUpdateProduct}
                  />
                  <TransactionHistory transactions={transactions.filter(tx =>
                    mockProducts.find(p => p.id === tx.productId)?.owner === user.stacksAddress
                  )} />
                </>
              )}
              {location.pathname === '/' && role === 'buyer' && (
                <>
                  <ProductList
                    products={currentProducts}
                    userAddress={user.stacksAddress}
                    onBuyProduct={handleBuyProduct}
                    onUnlistProduct={handleUnlistProduct}
                    onSelectProduct={setSelectedProduct}
                    role={role}
                    onDeleteProduct={handleDeleteProduct}
                  />
                  {totalPages > 1 && (
                    <div className="mt-6 flex justify-center">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                        <button
                          key={number}
                          onClick={() => paginate(number)}
                          className="mx-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none"
                        >
                          {number}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
              <Routes>
                <Route
                  path="/product/:id"
                  element={<ProductDetailPage
                    product={selectedProduct}
                    userAddress={user?.stacksAddress}
                    onBuyProduct={handleBuyProduct}
                    onRateProduct={handleRateProduct}
                    role={role}
                    downloadLink={downloadLinks[selectedProduct?.id]}
                  />}
                />
                <Route path="/" element={<Navigate to="/" />} />
              </Routes>
            </div>
          )}
          {showSuccessPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg shadow-xl">
                <h2 className="text-2xl font-semibold text-green-600 mb-4 text-center">Success!</h2>
                <p className="mb-4 text-center">Connected to wallet</p>
                <button
                  onClick={() => setShowSuccessPopup(false)}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}
          {showPaymentPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg shadow-xl">
                <h2 className="text-2xl font-semibold mb-4 text-center" style={{ color: paymentStatus === 'success' ? '#4CAF50' : '#ff4444' }}>
                  {paymentStatus === 'success' ? 'Payment Success!' : 'Payment Failed!'}
                </h2>
                <p className="mb-4 text-center">{paymentStatus === 'success' ? 'Payment transferred to seller.' : 'Transaction failed. Try again.'}</p>
                <button
                  onClick={() => setShowPaymentPopup(false)}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-4">
        <div className="container mx-auto text-center max-w-7xl">
          <p>© 2025 Mini Marketplace. All rights reserved.</p>
          <p className="mt-1 text-sm text-gray-400">Contact us at support@minimarketplace.com</p>
        </div>
      </footer>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;