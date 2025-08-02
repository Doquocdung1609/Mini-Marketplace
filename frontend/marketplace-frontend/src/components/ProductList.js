import React from 'react';
import { useNavigate } from 'react-router-dom';

function ProductList({ products, userAddress, onBuyProduct, onUnlistProduct, onSelectProduct, role, onDeleteProduct, onRemoveProduct }) {
  const navigate = useNavigate();

  if (!products || products.length === 0) {
    return <p className="text-gray-700 text-center mt-10">No products available.</p>;
  }

  const handleViewDetails = (product) => {
    onSelectProduct(product);
    navigate(`/product/${product.id}`);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition"
          >
            <img src={product.image} alt={product.name} className="w-full h-40 object-cover rounded-lg mb-4" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
              <p className="text-gray-600"><strong>Price:</strong> {product.price} microSTX</p>
              <p className="text-gray-600"><strong>Quantity:</strong> {product.quantity}</p>
              {role === 'buyer' && product.quantity > 0 && (
                <button
                  onClick={() => onBuyProduct(product.id)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg mt-2 hover:bg-blue-700 transition"
                >
                  Buy
                </button>
              )}
              {role === 'seller' && product.owner === userAddress && (
                <button
                  onClick={() => onUnlistProduct(product.id)}
                  className="w-full bg-red-600 text-white py-2 rounded-lg mt-2 hover:bg-red-700 transition"
                >
                  Unlist
                </button>
              )}
              {role === 'admin' && (
                <>
                  <button
                    onClick={() => onDeleteProduct(product.id)}
                    className="w-full bg-red-600 text-white py-2 rounded-lg mt-2 hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => onRemoveProduct(product.id, product.owner)}
                    className="w-full bg-yellow-600 text-white py-2 rounded-lg mt-2 hover:bg-yellow-700 transition"
                  >
                    Remove (Scam)
                  </button>
                </>
              )}
              <button
                onClick={() => handleViewDetails(product)}
                className="w-full bg-gray-600 text-white py-2 rounded-lg mt-2 hover:bg-gray-700 transition"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductList;