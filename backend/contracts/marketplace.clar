(define-constant admin 'ST3BZQ4ASRGPM8ANTZ1786EM9X2GW9S6JAC5YZJYC) ;; Admin address
(define-constant fee-percent u5) ;; 5% fee

;; Error codes
(define-constant err-product-sold u400) ;; Product already sold
(define-constant err-insufficient-balance u401) ;; Insufficient STX balance
(define-constant err-product-not-found u404) ;; Product not found
(define-constant err-invalid-price u405) ;; Price must be greater than 0
(define-constant err-invalid-ipfs-hash u406) ;; IPFS hash cannot be empty
(define-constant err-not-authorized u407) ;; Only seller or buyer can perform action
(define-constant err-invalid-score u408) ;; Rating score must be between 1 and 5
(define-constant err-already-rated u409) ;; Product already rated

;; State variables
(define-data-var last-id uint u0) ;; Tracks the last product ID

;; Data structure for products
(define-map products uint
  {
    seller: principal,
    price: uint,
    ipfsHash: (string-ascii 64),
    buyer: (optional principal),
    isSold: bool,
    totalRatings: uint,
    ratingCount: uint
  })

;; List a new product
(define-public (list-product (price uint) (ipfsHash (string-ascii 64)))
  (let ((new-id (+ (var-get last-id) u1)))
    (asserts! (> price u0) (err err-invalid-price))
    (asserts! (not (is-eq ipfsHash "")) (err err-invalid-ipfs-hash))
    (map-set products new-id
      {
        seller: tx-sender,
        price: price,
        ipfsHash: ipfsHash,
        buyer: none,
        isSold: false,
        totalRatings: u0,
        ratingCount: u0
      })
    (var-set last-id new-id)
    (print {event: "product-listed", id: new-id, seller: tx-sender})
    (ok new-id)))

;; Buy a product
(define-public (buy-product (id uint))
  (let ((product (unwrap! (map-get? products id) (err err-product-not-found))))
    (asserts! (not (get isSold product)) (err err-product-sold))
    (asserts! (not (is-eq tx-sender (get seller product))) (err err-not-authorized))
    (let (
          (price (get price product))
          (seller (get seller product)))
      (asserts! (>= (stx-get-balance tx-sender) price) (err err-insufficient-balance))
      (let (
            (amount-to-seller (/ (* price (- u100 fee-percent)) u100))
            (fee (- price amount-to-seller)))
        (try! (stx-transfer? amount-to-seller tx-sender seller))
        (try! (stx-transfer? fee tx-sender admin))
        (map-set products id (merge product {buyer: (some tx-sender), isSold: true}))
        (print {event: "product-bought", id: id, buyer: tx-sender, seller: seller})
        (ok true)))))

;; Unlist a product
(define-public (unlist-product (id uint))
  (let ((product (unwrap! (map-get? products id) (err err-product-not-found))))
    (asserts! (is-eq tx-sender (get seller product)) (err err-not-authorized))
    (asserts! (not (get isSold product)) (err err-product-sold))
    (map-delete products id)
    (print {event: "product-unlisted", id: id, seller: tx-sender})
    (ok true)))

;; Update product details
(define-public (update-product (id uint) (newPrice uint) (newIpfsHash (string-ascii 64)))
  (let ((product (unwrap! (map-get? products id) (err err-product-not-found))))
    (asserts! (is-eq tx-sender (get seller product)) (err err-not-authorized))
    (asserts! (not (get isSold product)) (err err-product-sold))
    (asserts! (> newPrice u0) (err err-invalid-price))
    (asserts! (not (is-eq newIpfsHash "")) (err err-invalid-ipfs-hash))
    (map-set products id (merge product {price: newPrice, ipfsHash: newIpfsHash}))
    (print {event: "product-updated", id: id, seller: tx-sender})
    (ok true)))

;; Rate a product
(define-public (rate-product (id uint) (score uint))
  (let ((product (unwrap! (map-get? products id) (err err-product-not-found))))
    (match (get buyer product)
      some-buyer
      (begin
        (asserts! (is-eq tx-sender some-buyer) (err err-not-authorized))
        (asserts! (<= (get ratingCount product) u0) (err err-already-rated))
        (asserts! (and (>= score u1) (<= score u5)) (err err-invalid-score))
        (map-set products id (merge product {totalRatings: score, ratingCount: u1}))
        (print {event: "product-rated", id: id, buyer: tx-sender, score: score})
        (ok true))
      (err err-not-authorized))))

;; Read-only: Get product details
(define-read-only (get-product (id uint))
  (map-get? products id))

;; Read-only: Get product owner
(define-read-only (get-owner (id uint))
  (match (map-get? products id)
    some-product (ok (get seller some-product))
    (err err-product-not-found)))

;; Read-only: Get average rating
(define-read-only (get-average-rating (id uint))
  (match (map-get? products id)
    some-product
    (let ((ratingCount (get ratingCount some-product)))
      (if (> ratingCount u0)
        (ok (/ (get totalRatings some-product) ratingCount))
        (ok u0)))
    (err err-product-not-found)))