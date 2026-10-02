import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "../common/Button";
import { productApi, stockApi } from "../../services/api";

export const IncomingStockForm = () => {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(50);
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [remarks, setRemarks] = useState(
    "Received from Sri Balaji Electricals, invoice #INV-4432."
  );
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productApi.getProducts();
        if (res.success && res.products) {
          setProducts(res.products);
          if (res.products.length > 0 && !selectedProductId) {
            setSelectedProductId(res.products[0]._id || res.products[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load products:", err);
      }
    };
    fetchProducts();
  }, []);

  const selectedProduct = products.find(
    (p) =>
      String(p._id || p.id) === String(selectedProductId) ||
      p.productCode === selectedProductId ||
      p.product_code === selectedProductId
  );
  const currentStock = selectedProduct
    ? Number(
        selectedProduct.current_quantity !== undefined
          ? selectedProduct.current_quantity
          : (selectedProduct.currentQuantity !== undefined
              ? selectedProduct.currentQuantity
              : (selectedProduct.currentStock || 0))
      )
    : 0;
  const productUnit = selectedProduct
    ? (typeof selectedProduct.unit === 'string'
        ? selectedProduct.unit
        : (selectedProduct.unit?.name || selectedProduct.unitName || selectedProduct.unit_name || ''))
    : '';
  const numQty = Number(quantity) || 0;
  const newCalculatedStock = currentStock + (numQty > 0 ? numQty : 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId || numQty <= 0) {
      setFeedback({
        type: "error",
        message: "Please select a valid product and enter a quantity greater than zero."
      });
      return;
    }

    setLoading(true);
    try {
      const res = await stockApi.incoming({
        productId: selectedProductId,
        quantity: numQty,
        date,
        remarks
      });

      if (res.success) {
        const prodName = res.product?.productName || res.product?.name || selectedProduct?.productName || selectedProduct?.name;
        const prev = res.previousQuantity !== undefined ? res.previousQuantity : currentStock;
        const cur = res.currentQuantity !== undefined ? res.currentQuantity : newCalculatedStock;

        setFeedback({
          type: "success",
          message: `Stock Updated Successfully: ${prodName} | Previous: ${prev} ${productUnit} | Added: +${numQty} ${productUnit} | Current: ${cur} ${productUnit}`
        });

        // Update local products list
        setProducts((prevList) =>
          prevList.map((p) =>
            String(p._id || p.id) === String(selectedProductId)
              ? { ...p, currentQuantity: cur, current_quantity: cur, currentStock: cur }
              : p
          )
        );

        setQuantity(0);
        setRemarks("");
      } else {
        setFeedback({ type: "error", message: res.message || "Failed to record stock." });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.response?.data?.message || err.message || "Error communicating with server."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card form-card">
      <div className="card-head">
        <h2>Record Incoming Stock</h2>
      </div>
      <div className="card-pad">
        {feedback && (
          <div
            className={
              feedback.type === "success" ? "success-box" : "alert-box"
            }
          >
            {feedback.type === "success" ? "✓ " : "⚠ "}
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field full">
              <label htmlFor="incoming-product">Product</label>
              <select
                id="incoming-product"
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setFeedback(null);
                }}
                required
              >
                {products.map((p) => {
                  const pId = p._id || p.id;
                  const pName = p.productName || p.name;
                  const pCode = p.productCode;
                  const pStock = p.currentQuantity !== undefined ? p.currentQuantity : p.currentStock;
                  return (
                    <option key={pId} value={pId}>
                      {pName} ({pCode}) — Current Stock: {pStock} {p.unit}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="field">
              <label htmlFor="incoming-qty">Quantity Received</label>
              <input
                type="number"
                id="incoming-qty"
                min="1"
                placeholder="e.g. 50"
                value={quantity || ""}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setFeedback(null);
                }}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="incoming-date">Date</label>
              <input
                type="date"
                id="incoming-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="field full">
              <label htmlFor="incoming-remarks">Remarks</label>
              <textarea
                id="incoming-remarks"
                placeholder="Optional supplier/invoice notes about this delivery"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="info-strip">
            <div className="item">
              <div className="k">Current Stock</div>
              <div className="v">
                {currentStock} {selectedProduct?.unit}
              </div>
            </div>
            <div className="item">
              <div className="k">Quantity Received</div>
              <div className="v">
                +{numQty} {selectedProduct?.unit}
              </div>
            </div>
            <div className="item">
              <div className="k">New Stock</div>
              <div className="v" style={{ color: "var(--green-600)" }}>
                {newCalculatedStock} {selectedProduct?.unit}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "Recording..." : "Record Incoming Stock"}
            </Button>
            <Link to="/products" className="btn-outline">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncomingStockForm;
