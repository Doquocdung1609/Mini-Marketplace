import React from 'react';

function TransactionHistory({ transactions }) {
  return (
    <div>
      <h2>Transaction History</h2>
      <ul>
        {transactions.map((tx, index) => (
          <li key={index}>
            <p>Event: {tx.print_event.event_name}</p>
            <p>Details: {JSON.stringify(tx.print_event.value)}</p>
            <p>Tx ID: <a href={`https://explorer.stacks.co/txid/${tx.tx_id}?chain=testnet`} target="_blank" rel="noopener noreferrer">{tx.tx_id}</a></p>
            <p>Block: {tx.block_height}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TransactionHistory;