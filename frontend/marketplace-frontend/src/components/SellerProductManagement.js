import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

function SellerProductManagement({ products, onUnlistProduct, onUpdateProduct, transactions }) {
  const [editProductId, setEditProductId] = useState(null);
  const [newIpfsHash, setNewIpfsHash] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const profitChartRef = useRef(null);
  const chartInstanceRef = useRef(null); // Theo dõi instance chart

  useEffect(() => {
    const ctx = profitChartRef.current?.getContext('2d');
    if (ctx && products.length > 0) {
      // Phá hủy chart cũ nếu tồn tại
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
      const revenueData = transactions
        .filter(tx => products.some(p => p.id === tx.productId && p.owner === products[0]?.owner))
        .reduce((acc, tx) => {
          const date = new Date(tx.timestamp).toLocaleDateString();
          acc[date] = (acc[date] || 0) + tx.amount;
          return acc;
        }, {});
      chartInstanceRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: Object.keys(revenueData),
          datasets: [{
            label: 'Profit (microSTX)',
            data: Object.values(revenueData),
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            fill: true,
            tension: 0.1
          }]
        },
        options: {
          scales: { y: { beginAtZero: true } },
          plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Profit Over Time' }
          }
        }
      });
    }
    // Cleanup khi component unmount
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [transactions, products]); // Loại bỏ profitChart khỏi dependency

  const handleUpdate = (productId) => {
    onUpdateProduct(productId, newIpfsHash, parseInt(newPrice), parseInt(newQuantity));
    setEditProductId(null);
    setNewIpfsHash('');
    setNewPrice('');
    setNewQuantity('');
  };

  return (
    <div className="bg-white mt-10 p-6 rounded-lg shadow-lg seller-dashboard">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Manage Your Products</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2 text-left">ID</th>
            <th className="border p-2 text-left">Name</th>
            <th className="border p-2 text-left">Price (microSTX)</th>
            <th className="border p-2 text-left">Quantity</th>
            <th className="border p-2 text-left">Sold</th>
            <th className="border p-2 text-left">Revenue (microSTX)</th>
            <th className="border p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr><td colSpan="7" className="border p-2 text-center text-gray-500">No products to manage.</td></tr>
          ) : (
            products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-100">
                <td className="border p-2">{product.id}</td>
                <td className="border p-2">{product.name}</td>
                <td className="border p-2">{product.price}</td>
                <td className="border p-2">{product.quantity}</td>
                <td className="border p-2">{product.sold}</td>
                <td className="border p-2">{product.revenue}</td>
                <td className="border p-2">
                  {editProductId === product.id ? (
                    <div className="space-x-2">
                      <input
                        type="text"
                        value={newIpfsHash}
                        onChange={(e) => setNewIpfsHash(e.target.value)}
                        placeholder="New IPFS Hash"
                        className="p-1 border rounded"
                      />
                      <input
                        type="number"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        placeholder="New Price"
                        className="p-1 border rounded"
                      />
                      <input
                        type="number"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(e.target.value)}
                        placeholder="New Quantity"
                        className="p-1 border rounded"
                      />
                      <button
                        onClick={() => handleUpdate(product.id)}
                        className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditProductId(null)}
                        className="bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="space-x-2">
                      <button
                        onClick={() => { setEditProductId(product.id); setNewIpfsHash(product.ipfsHash); setNewPrice(product.price); setNewQuantity(product.quantity); }}
                        className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onUnlistProduct(product.id)}
                        className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                      >
                        Unlist
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div style={{ marginTop: '10px' }}>
        <canvas ref={profitChartRef} style={{ maxWidth: '100%', height: 'auto' }}></canvas>
      </div>
    </div>
  );
}

export default SellerProductManagement;