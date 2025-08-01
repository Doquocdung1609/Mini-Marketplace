import React from 'react';

function ProductDetails({ product, userAddress, onUpdateProduct, onRateProduct }) {
  const [newIpfsHash, setNewIpfsHash] = React.useState(product.ipfsHash);
  const [newPrice, setNewPrice] = React.useState(product.price);
  const [rating, setRating] = React.useState('');

  const handleUpdate = () => onUpdateProduct(product.id, newIpfsHash, newPrice);
  const handleRate = () => onRateProduct(product.id, parseInt(rating));

  return (
    <div>
      <h2>Product Details</h2>
      <p>IPFS Hash: {product.ipfsHash}</p>
      <p>Price: {product.price} STX</p>
      <p>Avg Rating: {product.avgRating || 'N/A'}</p>
      {product.seller === userAddress && (
        <div>
          <input value={newIpfsHash} onChange={(e) => setNewIpfsHash(e.target.value)} />
          <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
          <button onClick={handleUpdate}>Update</button>
        </div>
      )}
      {product.buyer === userAddress && (
        <div>
          <input type="number" value={rating} onChange={(e) => setRating(e.target.value)} min="1" max="5" />
          <button onClick={handleRate}>Rate (1-5)</button>
        </div>
      )}
    </div>
  );
}

export default ProductDetails;