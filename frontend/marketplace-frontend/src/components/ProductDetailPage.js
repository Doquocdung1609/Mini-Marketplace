import React from 'react';
import { useParams } from 'react-router-dom';

function ProductDetailPage({ product, userAddress, onBuyProduct, onRateProduct, role, downloadLink, transactions }) {
  const { id } = useParams();

  if (!product || product.id !== parseInt(id)) {
    return <p className="text-red-500 text-center mt-10">Product not found.</p>;
  }

  const handleRate = (score) => {
    if (onRateProduct) {
      const hasBought = transactions.some(tx => tx.buyer === userAddress && tx.productId === product.id);
      if (hasBought) {
        onRateProduct(product.id, score);
      } else {
        alert('You must purchase this product before rating.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h2>
        <img src={product.image} alt={product.name} className="w-full h-64 object-cover rounded-lg mb-6" />
        <div className="space-y-4">
          <p className="text-gray-700"><strong>Price:</strong> {product.price} microSTX</p>
          <p className="text-gray-700"><strong>Description:</strong> {product.description}</p>
          <p className="text-gray-700"><strong>Quantity:</strong> {product.quantity}</p>
          <p className="text-gray-700"><strong>Sold:</strong> {product.sold}</p>
          <p className="text-gray-700"><strong>Rating:</strong> {product.avgRating} / 5</p>
          {role === 'buyer' && product.quantity > 0 && (
            <button
              onClick={() => onBuyProduct(product.id)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Buy
            </button>
          )}
          {downloadLink && (
            <a
              href={downloadLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
            >
              Download
            </a>
          )}
          <h3 className="text-xl font-semibold mt-6">Rate this Product</h3>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                onClick={() => handleRate(score)}
                className="bg-yellow-400 text-white px-4 py-2 rounded-full hover:bg-yellow-500 transition"
              >
                {score} Star{score > 1 ? 's' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;