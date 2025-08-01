import React, { useState } from 'react';
import { uploadToIPFS } from '../lib/stacks';

function ProductForm({ onListProduct }) {
  const [file, setFile] = useState(null);
  const [price, setPrice] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (file && price > 0) {
      setUploading(true);
      try {
        const ipfsHash = await uploadToIPFS(file);
        await onListProduct(ipfsHash, price);
        setFile(null);
        setPrice('');
      } catch (error) {
        console.error('Failed to list product:', error);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>List New Product</h2>
      <div>
        <label>File (Image, eBook, etc.):</label>
        <input 
          type="file" 
          onChange={(e) => setFile(e.target.files[0])} 
          required 
        />
      </div>
      <div>
        <label>Price (STX):</label>
        <input 
          type="number" 
          value={price} 
          onChange={(e) => setPrice(e.target.value)} 
          min="1" 
          required 
        />
      </div>
      <button type="submit" disabled={uploading}>
        {uploading ? 'Uploading...' : 'List Product'}
      </button>
    </form>
  );
}

export default ProductForm;