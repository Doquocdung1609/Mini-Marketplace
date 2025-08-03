import React, { useState } from 'react';
import { uploadToIPFS } from '../lib/stacks';

const ProductForm = ({ onListProduct, userAddress, categories }) => {
  const [price, setPrice] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [imagePreview, setImagePreview] = useState('');
  const [status, setStatus] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      setStatus('Please upload an image!');
      return;
    }
    setStatus('Uploading to IPFS...');
    try {
      console.log('Starting IPFS upload...');
      const imageHash = await uploadToIPFS(image);
      console.log('IPFS hash received:', imageHash);
      if (!imageHash || imageHash.length > 64) {
        throw new Error('Invalid IPFS hash received');
      }
      setStatus('Submitting to blockchain...');
      console.log('Calling listProduct with:', { ipfsHash: imageHash, price, quantity, category });
      await onListProduct(imageHash, price, quantity, category);
      setStatus('Product listed successfully!');
      setPrice('');
      setName('');
      setDescription('');
      setImage(null);
      setQuantity('');
      setCategory(categories[0]);
      setImagePreview('');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Upload or listing failed:', error);
      setStatus(`Failed to list product: ${error.message || 'Unknown error'}`);
      setTimeout(() => setStatus(''), 5000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h3 className="text-xl font-semibold mb-4">List New Product</h3>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 mb-2 border rounded"
      />
      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-2 mb-2 border rounded"
      />
      <input
        type="number"
        placeholder="Price (microSTX)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full p-2 mb-2 border rounded"
      />
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="w-full p-2 mb-2 border rounded"
      />
      {imagePreview && <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover mb-2" />}
      <input
        type="number"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        className="w-full p-2 mb-2 border rounded"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full p-2 mb-2 border rounded"
      >
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <button type="submit" className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700">
        List Product
      </button>
      {status && (
        <p className={`mt-2 text-center ${status.includes('Failed') ? 'text-red-500' : 'text-green-500'}`}>
          {status}
        </p>
      )}
    </form>
  );
};

export default ProductForm;