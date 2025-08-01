import React from 'react';

function ProductList({ products, userAddress, onBuyProduct, onUnlistProduct, onSelectProduct }) {
  return (
    <div>
      <h2>Products</h2>
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <p>Product ID: {product.id}</p>
            <p>Price: {product.price.value} STX</p>
            <p>IPFS: {product.ipfsHash.value}</p>
            <p>Status: {product.isSold.value ? 'Sold' : 'Available'}</p>
            <p>Average Rating: {product.avgRating.value}</p>
            <button onClick={() => onSelectProduct(product)}>View Details</button>
            {!product.isSold.value && userAddress !== product.seller.value && (
              <button onClick={() => onBuyProduct(product.id)}>Buy</button>
            )}
            {!product.isSold.value && userAddress === product.seller.value && (
              <button onClick={() => onUnlistProduct(product.id)}>Unlist</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProductList;
