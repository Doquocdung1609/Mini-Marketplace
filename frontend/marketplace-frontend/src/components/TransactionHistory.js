import React from 'react';

function TransactionHistory({ transactions }) {
  return (
    <div className="bg-white mt-10 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Transaction History</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2 text-left">Product ID</th>
            <th className="border p-2 text-left">Buyer</th>
            <th className="border p-2 text-left">Amount (microSTX)</th>
            <th className="border p-2 text-left">Time</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr><td colSpan="4" className="border p-2 text-center text-gray-500">No transactions yet.</td></tr>
          ) : (
            transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-100">
                <td className="border p-2">{tx.productId}</td>
                <td className="border p-2">{tx.buyer}</td>
                <td className="border p-2">{tx.amount}</td>
                <td className="border p-2">{tx.timestamp}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default TransactionHistory;