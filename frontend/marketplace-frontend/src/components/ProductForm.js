import React, { useState } from 'react';

const ProductForm = ({ onListProduct, userAddress, categories }) => {
  const [ipfsHash, setIpfsHash] = useState('');
  const [price, setPrice] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null); // Thay đổi từ string thành file
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [imagePreview, setImagePreview] = useState(''); // Preview ảnh

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    // Tạo preview
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      alert('Please upload an image!');
      return;
    }
    // Giả sử uploadToIPFS xử lý file và trả về hash
    const formData = new FormData();
    formData.append('image', image);
    const imageHash = await uploadToIPFS(formData); // Cần cập nhật trong lib/stacks.js
    onListProduct(ipfsHash, price, name, description, imageHash, quantity, category);
    setIpfsHash(''); setPrice(''); setName(''); setDescription(''); setImage(null); setQuantity(''); setCategory(categories[0]); setImagePreview('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h3 className="text-xl font-semibold mb-4">List New Product</h3>
      <input type="text" placeholder="IPFS Hash" value={ipfsHash} onChange={(e) => setIpfsHash(e.target.value)} className="w-full p-2 mb-2 border rounded" />
      <input type="number" placeholder="Price (microSTX)" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-2 mb-2 border rounded" />
      <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 mb-2 border rounded" />
      <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 mb-2 border rounded" />
      <input type="file" accept="image/*" onChange={handleImageChange} className="w-full p-2 mb-2 border rounded" />
      {imagePreview && <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover mb-2" />}
      <input type="number" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full p-2 mb-2 border rounded" />
      <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 mb-2 border rounded">
        {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
      </select>
      <button type="submit" className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700">List Product</button>
    </form>
  );
};

// Hàm giả lập uploadToIPFS (cần cập nhật trong lib/stacks.js)
async function uploadToIPFS(formData) {
  // Logic upload thực tế cần implement trong lib/stacks.js
  return `ipfs://mockImageHash${Date.now()}`;
}

export default ProductForm;