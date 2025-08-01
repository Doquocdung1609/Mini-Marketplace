const { Clarinet, Tx, Chain, Account, types } = require("clarinet");
const assert = require("assert");

Clarinet.test({
  name: "User can list and buy product",
  async fn(chain, accounts) {
    let seller = accounts.get("wallet_1");
    let buyer = accounts.get("wallet_2");
    let admin = accounts.get("deployer");

    let block = chain.mineBlock([
      Tx.contractCall("marketplace", "list-product", [
        types.utf8("ipfs://abc123"),
        types.uint(50000),
      ], seller.address)
    ]);

    let id = block.receipts[0].result.expectOk().expectUint(1);

    block = chain.mineBlock([
      Tx.contractCall("marketplace", "buy-product", [
        types.uint(id)
      ], buyer.address)
    ]);

    block.receipts[0].result.expectOk();

    let owner = chain.callReadOnlyFn("marketplace", "get-owner", [
      types.uint(id)
    ], buyer.address);

    owner.result.expectOk().expectSome().expectPrincipal(buyer.address);

    let product = chain.callReadOnlyFn("marketplace", "get-product", [
      types.uint(id)
    ], buyer.address);

    product.result.expectSome();
  }
});

Clarinet.test({
  name: "Cannot buy already sold product",
  async fn(chain, accounts) {
    let seller = accounts.get("wallet_1");
    let buyer1 = accounts.get("wallet_2");
    let buyer2 = accounts.get("wallet_3");

    let block = chain.mineBlock([
      Tx.contractCall("marketplace", "list-product", [
        types.utf8("ipfs://abc123"),
        types.uint(50000),
      ], seller.address)
    ]);

    let id = block.receipts[0].result.expectOk().expectUint(1);

    block = chain.mineBlock([
      Tx.contractCall("marketplace", "buy-product", [types.uint(id)], buyer1.address),
      Tx.contractCall("marketplace", "buy-product", [types.uint(id)], buyer2.address)
    ]);

    block.receipts[0].result.expectOk();
    block.receipts[1].result.expectErr().expectUint(400);
  }
});

Clarinet.test({
  name: "Cannot buy with insufficient balance",
  async fn(chain, accounts) {
    let seller = accounts.get("wallet_1");
    let buyer = accounts.get("wallet_2");

    let block = chain.mineBlock([
      Tx.contractCall("marketplace", "list-product", [
        types.utf8("ipfs://abc123"),
        types.uint(999999999), // High price
      ], seller.address)
    ]);

    let id = block.receipts[0].result.expectOk().expectUint(1);

    block = chain.mineBlock([
      Tx.contractCall("marketplace", "buy-product", [types.uint(id)], buyer.address)
    ]);

    block.receipts[0].result.expectErr().expectUint(401);
  }
});

Clarinet.test({
  name: "Seller can unlist unsold product",
  async fn(chain, accounts) {
    let seller = accounts.get("wallet_1");
    let nonSeller = accounts.get("wallet_2");

    let block = chain.mineBlock([
      Tx.contractCall("marketplace", "list-product", [
        types.utf8("ipfs://abc123"),
        types.uint(50000),
      ], seller.address)
    ]);

    let id = block.receipts[0].result.expectOk().expectUint(1);

    block = chain.mineBlock([
      Tx.contractCall("marketplace", "unlist-product", [types.uint(id)], seller.address),
      Tx.contractCall("marketplace", "unlist-product", [types.uint(id)], nonSeller.address)
    ]);

    block.receipts[0].result.expectOk();
    block.receipts[1].result.expectErr().expectUint(404); // Product already deleted
  }
});

Clarinet.test({
  name: "Seller can update unsold product",
  async fn(chain, accounts) {
    let seller = accounts.get("wallet_1");
    let nonSeller = accounts.get("wallet_2");

    let block = chain.mineBlock([
      Tx.contractCall("marketplace", "list-product", [
        types.utf8("ipfs://abc123"),
        types.uint(50000),
      ], seller.address)
    ]);

    let id = block.receipts[0].result.expectOk().expectUint(1);

    block = chain.mineBlock([
      Tx.contractCall("marketplace", "update-product", [
        types.uint(id),
        types.utf8("ipfs://xyz789"),
        types.uint(60000)
      ], seller.address),
      Tx.contractCall("marketplace", "update-product", [
        types.uint(id),
        types.utf8("ipfs://xyz789"),
        types.uint(60000)
      ], nonSeller.address)
    ]);

    block.receipts[0].result.expectOk();
    block.receipts[1].result.expectErr().expectUint(407); // Unauthorized

    let product = chain.callReadOnlyFn("marketplace", "get-product", [
      types.uint(id)
    ], seller.address);

    let productData = product.result.expectSome();
    assert.strictEqual(productData.expectTuple().price, "60000");
    assert.strictEqual(productData.expectTuple().ipfsHash, '"ipfs://xyz789"');
  }
});

Clarinet.test({
  name: "Buyer can rate purchased product",
  async fn(chain, accounts) {
    let seller = accounts.get("wallet_1");
    let buyer = accounts.get("wallet_2");
    let nonBuyer = accounts.get("wallet_3");

    let block = chain.mineBlock([
      Tx.contractCall("marketplace", "list-product", [
        types.utf8("ipfs://abc123"),
        types.uint(50000),
      ], seller.address)
    ]);

    let id = block.receipts[0].result.expectOk().expectUint(1);

    block = chain.mineBlock([
      Tx.contractCall("marketplace", "buy-product", [types.uint(id)], buyer.address)
    ]);

    block.receipts[0].result.expectOk();

    block = chain.mineBlock([
      Tx.contractCall("marketplace", "rate-product", [
        types.uint(id),
        types.uint(4)
      ], buyer.address),
      Tx.contractCall("marketplace", "rate-product", [
        types.uint(id),
        types.uint(4)
      ], nonBuyer.address),
      Tx.contractCall("marketplace", "rate-product", [
        types.uint(id),
        types.uint(4)
      ], buyer.address) // Try rating again
    ]);

    block.receipts[0].result.expectOk();
    block.receipts[1].result.expectErr().expectUint(407); // Unauthorized
    block.receipts[2].result.expectErr().expectUint(409); // Already rated

    let avgRating = chain.callReadOnlyFn("marketplace", "get-average-rating", [
      types.uint(id)
    ], buyer.address);

    avgRating.result.expectOk().expectUint(4);
  }
});
