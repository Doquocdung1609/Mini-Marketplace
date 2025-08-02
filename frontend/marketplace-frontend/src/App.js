import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { connectWallet, listProduct, buyProduct, unlistProduct, updateProduct, rateProduct, getTransactionHistory, deleteProduct, mockProducts, mockRatings, downloadLinks } from './lib/stacks';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import TransactionHistory from './components/TransactionHistory';
import SellerProductManagement from './components/SellerProductManagement';
import ProductDetailPage from './components/ProductDetailPage';
import Chart from 'chart.js/auto';
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
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [sellerNotifications, setSellerNotifications] = useState({});
  const [slideIndex, setSlideIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState(['Ebook', 'Photos', 'Templates', 'Music', 'Software']);
  const location = useLocation();
  const navigate = useNavigate();
  const adminChartRef = useRef(null);
  const adminChartInstance = useRef(null);

  const handleConnectWallet = async () => {
    try {
      const result = await connectWallet();
      if (result.success) {
        setUser({ stacksAddress: result.address });
        setError(null);
        setShowSuccessPopup(true);
        setTimeout(() => {
          setShowSuccessPopup(false);
          setShowRoleSelection(true);
        }, 3000);
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setError('Failed to connect wallet.');
    }
  };

  const selectRole = (selectedRole) => {
    setRole(selectedRole);
    localStorage.setItem('role', selectedRole);
    setShowRoleSelection(false);
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

  const handleListProduct = async (ipfsHash, price, name, description, image, quantity, category) => {
    try {
      if (!user || !user.stacksAddress) throw new Error('User not authenticated');
      await listProduct(ipfsHash, price, user, name, description, image, quantity, category);
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
      if (!user || !user.stacksAddress) throw new Error('User not authenticated');
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
      if (!user || !user.stacksAddress) throw new Error('User not authenticated');
      await unlistProduct(productId, user);
      await fetchProducts();
      await fetchTransactions();
      setError(null);
    } catch (error) {
      console.error('Unlist product failed:', error);
      setError('Failed to unlist product.');
    }
  };

  const handleUpdateProduct = async (productId, newIpfsHash, newPrice, newQuantity, newCategory) => {
    try {
      if (!user || !user.stacksAddress) throw new Error('User not authenticated');
      await updateProduct(productId, newIpfsHash, newPrice, user, newQuantity, newCategory);
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
      if (!user || !user.stacksAddress) throw new Error('User not authenticated');
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
      if (!user || !user.stacksAddress) throw new Error('User not authenticated');
      await deleteProduct(productId, user);
      await fetchProducts();
      await fetchTransactions();
      setError(null);
    } catch (error) {
      console.error('Delete product failed:', error);
      setError('Only admin can delete products.');
    }
  };

  const handleRemoveProduct = (productId, sellerAddress) => {
    const updatedProducts = products.filter(p => p.id !== productId);
    setProducts(updatedProducts);
    setSellerNotifications(prev => ({
      ...prev,
      [sellerAddress]: 'Your product has been removed by admin due to suspected scam activity.'
    }));
    setTimeout(() => {
      setSellerNotifications(prev => {
        const { [sellerAddress]: _, ...rest } = prev;
        return rest;
      });
    }, 5000);
  };

  const addCategory = (newCategory) => {
    if (role === 'admin' && newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
    }
  };

  const removeCategory = (categoryToRemove) => {
    if (role === 'admin' && categories.length > 1) {
      setCategories(categories.filter(cat => cat !== categoryToRemove));
      setSelectedCategory('All');
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchTransactions();
    }
  }, [user]);

  const nextSlide = () => setSlideIndex((prev) => (prev + 1) % 3);
  const prevSlide = () => setSlideIndex((prev) => (prev - 1 + 3) % 3);
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const suggestedProducts = useMemo(() => {
    const popularCategory = [...products].reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {});
    const topCategory = Object.keys(popularCategory).reduce((a, b) => popularCategory[a] > popularCategory[b] ? a : b, 'Ebook');
    return [...products].filter(p => p.category === topCategory).sort(() => 0.5 - Math.random()).slice(0, 4);
  }, [products]);

  const handleViewSuggestedProduct = (product) => {
    setSelectedProduct(product);
    navigate(`/product/${product.id}`);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedCategory === 'All' || product.category === selectedCategory)
    );
  }, [products, searchQuery, selectedCategory]);

  const renderAdminChart = () => {
    if (adminChartInstance.current) {
      adminChartInstance.current.destroy();
    }
    const ctx = adminChartRef.current?.getContext('2d');
    if (ctx) {
      adminChartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: Object.keys(categoryCounts),
          datasets: [{
            label: 'Number of Products',
            data: Object.values(categoryCounts),
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: { y: { beginAtZero: true } },
          plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Products by Category' }
          }
        }
      });
    }
  };

  const categoryCounts = useMemo(() => {
    return products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {});
  }, [products]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center max-w-7xl">
          <h1 className="text-3xl font-bold">Mini Marketplace</h1>
          {!user && (
            <button
              onClick={handleConnectWallet}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1">
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

        <main className="flex-1 p-6">
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {location.pathname === '/' && (
            <div className="min-h-screen flex flex-col items-center justify-center">
              {user && (
                <div className="w-full max-w-6xl mb-6 flex space-x-4">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-3/4 p-2 border rounded-lg"
                  />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-1/4 p-2 border rounded-lg"
                  >
                    <option value="All">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}
              <h2 className="text-5xl font-bold text-gray-800 mb-12 text-center">Welcome to Market</h2>
              <div className="w-full max-w-6xl mb-6">
                <div className="relative w-full overflow-hidden">
                  <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${slideIndex * 100}%)` }}>
                    <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?fit=crop&w=800&h=300" alt="Ad 1" className="w-full h-48 object-cover flex-shrink-0" />
                    <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?fit=crop&w=800&h=300" alt="Ad 2" className="w-full h-48 object-cover flex-shrink-0" />
                    <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?fit=crop&w=800&h=300" alt="Ad 3" className="w-full h-48 object-cover flex-shrink-0" />
                  </div>
                  <button
                    onClick={prevSlide}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700"
                  >
                    &lt;
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700"
                  >
                    &gt;
                  </button>
                </div>
              </div>
              {user && (
                <>
                  <h3 className="text-2xl font-semibold text-gray-700 mb-6">Hot Product</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
                    {suggestedProducts.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
                        onClick={() => handleViewSuggestedProduct(product)}
                      >
                        <img src={product.image} alt={product.name} className="w-full h-40 object-cover rounded-lg mb-4" />
                        <h4 className="text-lg font-semibold text-gray-800">{product.name}</h4>
                        <p className="text-gray-600">Price: {product.price} microSTX</p>
                      </div>
                    ))}
                  </div>
                  {(role === 'buyer' || role === 'seller' || role === 'admin') && (
                    <div className="mt-12 w-full max-w-6xl">
                      <ProductList
                        products={filteredProducts}
                        userAddress={user?.stacksAddress}
                        onBuyProduct={handleBuyProduct}
                        onUnlistProduct={handleUnlistProduct}
                        onSelectProduct={setSelectedProduct}
                        role={role}
                        onDeleteProduct={handleDeleteProduct}
                        onRemoveProduct={handleRemoveProduct}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {role === 'seller' && location.pathname === '/seller' && (
            <div className="w-full max-w-6xl">
              <ProductForm onListProduct={handleListProduct} userAddress={user?.stacksAddress} categories={categories} />
              <SellerProductManagement
                products={products.filter(p => p.owner === user?.stacksAddress)}
                onUnlistProduct={handleUnlistProduct}
                onUpdateProduct={handleUpdateProduct}
                transactions={transactions}
              />
              <TransactionHistory transactions={transactions.filter(tx =>
                mockProducts.find(p => p.id === tx.productId)?.owner === user?.stacksAddress
              )} />
            </div>
          )}
          {role === 'admin' && location.pathname === '/admin' && (
            <div className="w-full max-w-6xl">
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="New Category..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.target.value) {
                      addCategory(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-1/2 p-2 border rounded-lg mr-2"
                />
                <button
                  onClick={() => removeCategory(selectedCategory)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  disabled={selectedCategory === 'All' || categories.length <= 1}
                >
                  Remove Category
                </button>
              </div>
              <ProductList
                products={products}
                userAddress={user?.stacksAddress}
                onBuyProduct={handleBuyProduct}
                onUnlistProduct={handleUnlistProduct}
                onSelectProduct={setSelectedProduct}
                role={role}
                onDeleteProduct={handleDeleteProduct}
                onRemoveProduct={handleRemoveProduct}
              />
              <div className="mt-6">
                <canvas ref={adminChartRef} style={{ maxWidth: '100%', height: 'auto' }}></canvas>
                <button
                  onClick={renderAdminChart}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Show Category Stats
                </button>
              </div>
            </div>
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
                transactions={transactions}
              />}
            />
            <Route path="/seller" element={<Navigate to="/seller" />} />
            <Route path="/admin" element={<Navigate to="/admin" />} />
            <Route path="/" element={<Navigate to="/" />} />
          </Routes>
          {role === 'seller' && sellerNotifications[user?.stacksAddress] && (
            <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
              {sellerNotifications[user.stacksAddress]}
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
          {showRoleSelection && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg shadow-xl">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Select Your Role</h2>
                <div className="space-y-4">
                  <button
                    onClick={() => selectRole('buyer')}
                    className="w-full bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition transform hover:scale-105"
                  >
                    Buyer
                  </button>
                  <button
                    onClick={() => selectRole('seller')}
                    className="w-full bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition transform hover:scale-105"
                  >
                    Seller
                  </button>
                  <button
                    onClick={() => selectRole('admin')}
                    className="w-full bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition transform hover:scale-105"
                  >
                    Admin
                  </button>
                  <button
                    onClick={() => setShowRoleSelection(false)}
                    className="w-full bg-gray-600 text-white p-4 rounded-lg hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                </div>
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