import React, { useState } from 'react';
import { mockProducts } from '../lib/stacks';

function ProductForm({ onListProduct, userAddress }) {
  const [ipfsHash, setIpfsHash] = useState('');
  const [price, setPrice] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    onListProduct(ipfsHash, parseInt(price), name, description, image, parseInt(quantity));
    setIpfsHash('');
    setPrice('');
    setName('');
    setDescription('');
    setImage('');
    setQuantity(1);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">List New Product</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Product Name"
          required
          className="w-full p-2 border rounded-lg"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          required
          className="w-full p-2 border rounded-lg"
        />
        <input
          type="text"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="Image URL"
          required
          className="w-full p-2 border rounded-lg"
        />
        <input
          type="text"
          value={ipfsHash}
          onChange={(e) => setIpfsHash(e.target.value)}
          placeholder="IPFS Hash"
          required
          className="w-full p-2 border rounded-lg"
        />
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price (microSTX)"
          required
          className="w-full p-2 border rounded-lg"
        />
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Quantity"
          min="1"
          required
          className="w-full p-2 border rounded-lg"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          List Product
        </button>
      </form>
      <div className="mt-4 text-gray-700">
        <p>Seller: {userAddress}</p>
        <p>Products Sold: {mockProducts.filter(p => p.owner === userAddress).reduce((sum, p) => sum + p.sold, 0)}</p>
        <p>Total Revenue: {mockProducts.filter(p => p.owner === userAddress).reduce((sum, p) => sum + p.revenue, 0)} microSTX</p>
      </div>
    </div>
  );
}

export default ProductForm;