;; ;; Contract: Mini Marketplace for Digital Goods
;; ;; Description: A smart contract for listing, buying, unlisting, updating, and rating digital goods using STX
;; (define-data-var last-id uint u0)
;; (define-data-var marketplace-fee uint u100) ;; 1% fee (100 basis points)
;; (define-data-var marketplace-admin principal tx-sender)

;; ;; Data structure for products
;; (define-map products 
;;   ((id uint)) 
;;   {
;;     seller: principal,
;;     price: uint,
;;     ipfsHash: (string-utf8 256),
;;     buyer: (optional principal),
;;     isSold: bool,
;;     totalRatings: uint, ;; Total sum of rating scores
;;     ratingCount: uint   ;; Number of ratings
;;   }
;; )

;; ;; Data structure for ratings (to ensure one rating per buyer)
;; (define-map ratings
;;   ((product-id uint) (rater principal))
;;   {
;;     score: uint ;; Rating score (1-5)
;;   }
;; )

;; ;; Error codes
;; (define-constant ERR-PRODUCT-SOLD u400)
;; (define-constant ERR-INSUFFICIENT-BALANCE u401)
;; (define-constant ERR-PRODUCT-NOT-FOUND u404)
;; (define-constant ERR-INVALID-PRICE u405)
;; (define-constant ERR-INVALID-IPFS-HASH u406)
;; (define-constant ERR-UNAUTHORIZED u407)
;; (define-constant ERR-INVALID-RATING u408)
;; (define-constant ERR-ALREADY-RATED u409)

;; ;; List a new product
;; (define-public (list-product (ipfsHash (string-utf8 256)) (price uint))
;;   (begin
;;     (asserts! (> price u0) (err ERR-INVALID-PRICE)) ;; Price must be greater than 0
;;     (asserts! (> (len ipfsHash) u0) (err ERR-INVALID-IPFS-HASH)) ;; IPFS hash cannot be empty
;;     (let ((id (+ (var-get last-id) u1)))
;;       (map-set products 
;;         ((id id)) 
;;         {
;;           seller: tx-sender,
;;           price: price,
;;           ipfsHash: ipfsHash,
;;           buyer: none,
;;           isSold: false,
;;           totalRatings: u0,
;;           ratingCount: u0
;;         }
;;       )
;;       (var-set last-id id)
;;       (print {event: "product-listed", id: id, seller: tx-sender, price: price})
;;       (ok id)
;;     )
;;   )
;; )

;; ;; Buy a product
;; (define-public (buy-product (id uint))
;;   (let (
;;         (product (map-get? products ((id id))))
;;        )
;;     (match product p
;;       (let (
;;             (fee-amount (/ (* (var-get marketplace-fee) (get price p)) u10000)) ;; 1% fee
;;             (seller-amount (- (get price p) fee-amount)) ;; Seller gets price minus fee
;;            )
;;         (asserts! (not (get isSold p)) (err ERR-PRODUCT-SOLD)) ;; Product not sold
;;         (asserts! (not (is-eq (get seller p) tx-sender)) (err ERR-UNAUTHORIZED)) ;; Buyer cannot be seller
;;         (asserts! (>= (stx-get-balance tx-sender) (get price p)) (err ERR-INSUFFICIENT-BALANCE)) ;; Check balance
;;         (try! (stx-transfer? seller-amount tx-sender (get seller p))) ;; Transfer to seller
;;         (try! (stx-transfer? fee-amount tx-sender (var-get marketplace-admin))) ;; Transfer fee to admin
;;         (map-set products 
;;           ((id id))
;;           {
;;             seller: (get seller p),
;;             price: (get price p),
;;             ipfsHash: (get ipfsHash p),
;;             buyer: (some tx-sender),
;;             isSold: true,
;;             totalRatings: (get totalRatings p),
;;             ratingCount: (get ratingCount p)
;;           }
;;         )
;;         (print {event: "product-bought", id: id, buyer: tx-sender, price: (get price p)})
;;         (ok true)
;;       )
;;       (err ERR-PRODUCT-NOT-FOUND) ;; Product not found
;;     )
;;   )
;; )

;; ;; Unlist a product (only seller can unlist)
;; (define-public (unlist-product (id uint))
;;   (let ((product (map-get? products ((id id)))))
;;     (match product p
;;       (begin
;;         (asserts! (is-eq (get seller p) tx-sender) (err ERR-UNAUTHORIZED)) ;; Only seller can unlist
;;         (asserts! (not (get isSold p)) (err ERR-PRODUCT-SOLD)) ;; Product not sold
;;         (map-delete products ((id id)))
;;         (print {event: "product-unlisted", id: id, seller: tx-sender})
;;         (ok true)
;;       )
;;       (err ERR-PRODUCT-NOT-FOUND) ;; Product not found
;;     )
;;   )
;; )

;; ;; Update product (only seller can update price or ipfsHash of unsold product)
;; (define-public (update-product (id uint) (newIpfsHash (string-utf8 256)) (newPrice uint))
;;   (let ((product (map-get? products ((id id)))))
;;     (match product p
;;       (begin
;;         (asserts! (is-eq (get seller p) tx-sender) (err ERR-UNAUTHORIZED)) ;; Only seller can update
;;         (asserts! (not (get isSold p)) (err ERR-PRODUCT-SOLD)) ;; Product not sold
;;         (asserts! (> newPrice u0) (err ERR-INVALID-PRICE)) ;; New price must be greater than 0
;;         (asserts! (> (len newIpfsHash) u0) (err ERR-INVALID-IPFS-HASH)) ;; New IPFS hash cannot be empty
;;         (map-set products 
;;           ((id id))
;;           {
;;             seller: (get seller p),
;;             price: newPrice,
;;             ipfsHash: newIpfsHash,
;;             buyer: (get buyer p),
;;             isSold: (get isSold p),
;;             totalRatings: (get totalRatings p),
;;             ratingCount: (get ratingCount p)
;;           }
;;         )
;;         (print {event: "product-updated", id: id, seller: tx-sender, newPrice: newPrice, newIpfsHash: newIpfsHash})
;;         (ok true)
;;       )
;;       (err ERR-PRODUCT-NOT-FOUND) ;; Product not found
;;     )
;;   )
;; )

;; ;; Rate a product (only buyer can rate after purchase, score 1-5)
;; (define-public (rate-product (id uint) (score uint))
;;   (let ((product (map-get? products ((id id)))))
;;     (match product p
;;       (begin
;;         (asserts! (is-eq (get buyer p) (some tx-sender)) (err ERR-UNAUTHORIZED)) ;; Only buyer can rate
;;         (asserts! (and (>= score u1) (<= score u5)) (err ERR-INVALID-RATING)) ;; Score must be 1-5
;;         (asserts! (is-none (map-get? ratings ((product-id id) (rater tx-sender)))) (err ERR-ALREADY-RATED)) ;; Not rated yet
;;         (map-set ratings 
;;           ((product-id id) (rater tx-sender))
;;           { score: score }
;;         )
;;         (map-set products 
;;           ((id id))
;;           {
;;             seller: (get seller p),
;;             price: (get price p),
;;             ipfsHash: (get ipfsHash p),
;;             buyer: (get buyer p),
;;             isSold: (get isSold p),
;;             totalRatings: (+ (get totalRatings p) score),
;;             ratingCount: (+ (get ratingCount p) u1)
;;           }
;;         )
;;         (print {event: "product-rated", id: id, rater: tx-sender, score: score})
;;         (ok true)
;;       )
;;       (err ERR-PRODUCT-NOT-FOUND) ;; Product not found
;;     )
;;   )
;; )

;; ;; Get product details
;; (define-read-only (get-product (id uint))
;;   (map-get? products ((id id)))
;; )

;; ;; Get product owner
;; (define-read-only (get-owner (id uint))
;;   (match (map-get? products ((id id)))
;;     product (ok (get buyer product))
;;     (err ERR-PRODUCT-NOT-FOUND)
;;   )
;; )

;; ;; Get product average rating
;; (define-read-only (get-average-rating (id uint))
;;   (let ((product (map-get? products ((id id)))))
;;     (match product p
;;       (if (> (get ratingCount p) u0)
;;         (ok (/ (get totalRatings p) (get ratingCount p)))
;;         (ok u0) ;; No ratings yet
;;       )
;;       (err ERR-PRODUCT-NOT-FOUND)
;;     )
;;   )
;; )