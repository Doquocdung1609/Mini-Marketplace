import React, { useState } from 'react';

function ProductDetails({ product, userAddress, onUpdateProduct, onRateProduct, role, downloadLink, transactions }) {
  const [newIpfsHash, setNewIpfsHash] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newQuantity, setNewQuantity] = useState(product.quantity);
  const [score, setScore] = useState('');
  const [preview, setPreview] = useState(false);

  const handleUpdate = () => {
    onUpdateProduct(product.id, newIpfsHash, parseInt(newPrice), parseInt(newQuantity));
    setNewIpfsHash('');
    setNewPrice('');
    setNewQuantity(product.quantity);
  };

  const handleRate = () => {
    if (onRateProduct) {
      const hasBought = transactions.some(tx => tx.buyer === userAddress && tx.productId === product.id);
      if (hasBought) {
        onRateProduct(product.id, parseInt(score));
        setScore('');
      } else {
        alert('You must purchase this product before rating.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Product Details</h2>
        <img src={product.image} alt={product.name} className="w-48 h-48 object-cover rounded-lg mb-4" />
        <div className="space-y-2">
          <p className="text-gray-700"><strong>Name:</strong> {product.name}</p>
          <p className="text-gray-700"><strong>Description:</strong> {product.description}</p>
          <p className="text-gray-700"><strong>Price:</strong> {product.price} microSTX</p>
          <p className="text-gray-700"><strong>Owner:</strong> {product.owner}</p>
          <p className="text-gray-700"><strong>Average Rating:</strong> {product.avgRating}</p>
          <p className="text-gray-700"><strong>Quantity:</strong> {product.quantity} | <strong>Sold:</strong> {product.sold}</p>
          {role === 'buyer' && !downloadLink && (
            <button
              onClick={() => setPreview(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Preview
            </button>
          )}
          {role === 'buyer' && downloadLink && (
            <a
              href={downloadLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Download Product
            </a>
          )}
          {role === 'seller' && product.owner === userAddress && (
            <div className="mt-4 space-y-2">
              <input
                type="text"
                value={newIpfsHash}
                onChange={(e) => setNewIpfsHash(e.target.value)}
                placeholder="New IPFS Hash"
                className="w-full p-2 border rounded-lg"
              />
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="New Price"
                className="w-full p-2 border rounded-lg"
              />
              <input
                type="number"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                placeholder="New Quantity"
                className="w-full p-2 border rounded-lg"
              />
              <button
                onClick={handleUpdate}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Update
              </button>
            </div>
          )}
          {role === 'buyer' && !downloadLink && (
            <div className="mt-4 space-y-2">
              <input
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="Rate (0-5)"
                max="5"
                className="w-full p-2 border rounded-lg"
              />
              <button
                onClick={handleRate}
                className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition"
              >
                Rate
              </button>
            </div>
          )}
          {preview && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">Preview: {product.description} (Mock preview - full access after purchase)</p>
              <button
                onClick={() => setPreview(false)}
                className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Close Preview
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;