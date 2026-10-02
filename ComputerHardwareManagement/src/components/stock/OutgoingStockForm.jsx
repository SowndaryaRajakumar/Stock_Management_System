import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "../common/Button";
import { productApi, masterDataApi, stockApi } from "../../services/api";

export const OutgoingStockForm = () => {
  const [products, setProducts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(2);
  const [department, setDepartment] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [remarks, setRemarks] = useState(
    "Issued for maintenance replacement in department."
  );
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [prodRes, deptRes] = await Promise.all([
          productApi.getProducts(),
          masterDataApi.getDepartments()
        ]);

        if (prodRes.success && prodRes.products) {
          setProducts(prodRes.products);
          if (prodRes.products.length > 0 && !selectedProductId) {
            setSelectedProductId(prodRes.products[0]._id || prodRes.products[0].id);
          }
        }

        if (deptRes.success && deptRes.departments) {
          setDepartments(deptRes.departments);
          if (deptRes.departments.length > 0 && !department) {
            setDepartment(deptRes.departments[0].name);
          }
        }
      } catch (err) {
        console.error("Failed to load form data:", err);
      }
    };
    loadInitialData();
  }, []);

  const selectedProduct = products.find(
    (p) =>
      String(p._id || p.id) === String(selectedProductId) ||
      p.productCode === selectedProductId ||
      p.product_code === selectedProductId
  );
  const availableStock = selectedProduct
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
  const minStock = selectedProduct
    ? Number(
        selectedProduct.minimum_quantity !== undefined
          ? selectedProduct.minimum_quantity
          : (selectedProduct.minimumQuantity !== undefined
              ? selectedProduct.minimumQuantity
              : (selectedProduct.minimum_stock_level !== undefined
                  ? selectedProduct.minimum_stock_level
                  : (selectedProduct.minimumStockLevel || selectedProduct.minStock || 0)))
      )
    : 0;
  const numQty = Number(quantity) || 0;

  const isOverLimit = numQty > availableStock;
  const remainingStock = availableStock - numQty;
  const willBeLowStock = !isOverLimit && numQty > 0 && remainingStock < minStock;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId || numQty <= 0) {
      setFeedback({
        type: "error",
        message: "Please select a product and enter a valid quantity."
      });
      return;
    }

    if (isOverLimit) {
      setFeedback({
        type: "error",
        message: `Validation Error: Cannot issue ${numQty} ${productUnit || 'units'}. Only ${availableStock} ${productUnit} available in stock.`
      });
      return;
    }

    setLoading(true);
    try {
      const res = await stockApi.outgoing({
        productId: selectedProductId,
        quantity: numQty,
        department,
        date,
        remarks
      });

      if (res.success) {
        const prodName = res.product?.productName || res.product?.name || selectedProduct?.productName || selectedProduct?.name;
        const cur = res.currentQuantity !== undefined ? res.currentQuantity : remainingStock;

        let msg = `Stock Issued Successfully: Issued ${res.issuedQuantity || numQty} units of ${prodName} to ${department}. Remaining stock: ${cur} ${productUnit}.`;
        if (res.isLowStock || cur < minStock) {
          msg += ` ⚠ LOW STOCK: Item is now below its minimum stock level (${minStock} ${productUnit}).`;
        }

        setFeedback({
          type: "success",
          message: msg
        });

        // Update local products stock
        setProducts((prevList) =>
          prevList.map((p) =>
            String(p._id || p.id) === String(selectedProductId)
              ? { ...p, currentQuantity: cur, current_quantity: cur, currentStock: cur }
              : p
          )
        );

        setQuantity(1);
      } else {
        setFeedback({ type: "error", message: res.message || "Failed to issue stock." });
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
        <h2>Issue Stock</h2>
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
              <label htmlFor="outgoing-product">Product</label>
              <select
                id="outgoing-product"
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
                      {pName} ({pCode}) — Available Stock: {pStock} {p.unit}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="field">
              <label htmlFor="outgoing-qty">Quantity to Issue</label>
              <input
                type="number"
                id="outgoing-qty"
                min="1"
                max={availableStock > 0 ? availableStock : 1}
                placeholder="e.g. 2"
                value={quantity || ""}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setFeedback(null);
                }}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="outgoing-dept">Destination Department</label>
              <select
                id="outgoing-dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              >
                {departments.map((d) => (
                  <option key={d._id || d.name} value={d.name}>
                    {d.name} {d.code ? `(${d.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="outgoing-date">Date</label>
              <input
                type="date"
                id="outgoing-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="field full">
              <label htmlFor="outgoing-remarks">Remarks</label>
              <textarea
                id="outgoing-remarks"
                placeholder="Specific lab/room/person requiring this issue..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="info-strip">
            <div className="item">
              <div className="k">Available Stock</div>
              <div className="v">
                {availableStock} {selectedProduct?.unit}
              </div>
            </div>
            <div className="item">
              <div className="k">Quantity Issued</div>
              <div className="v" style={{ color: "var(--red-600)" }}>
                -{numQty} {selectedProduct?.unit}
              </div>
            </div>
            <div className="item">
              <div className="k">Remaining Stock</div>
              <div
                className="v"
                style={{
                  color: isOverLimit
                    ? "var(--red-600)"
                    : willBeLowStock
                    ? "var(--amber-600)"
                    : "var(--green-600)"
                }}
              >
                {isOverLimit ? "Insufficient!" : `${remainingStock} ${selectedProduct?.unit}`}
              </div>
            </div>
          </div>

          {willBeLowStock && (
            <div
              className="alert-box"
              style={{
                background: "var(--amber-50)",
                color: "var(--amber-800)",
                borderColor: "var(--amber-200)",
                marginTop: "12px"
              }}
            >
              ⚠ <strong>Low Stock Warning:</strong> Issuing this quantity will reduce stock below the minimum threshold ({minStock} {selectedProduct?.unit}).
            </div>
          )}

          <div className="form-actions">
            <Button
              variant="primary"
              type="submit"
              disabled={isOverLimit || availableStock <= 0 || loading}
            >
              {loading ? "Issuing..." : "Issue Stock"}
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

export default OutgoingStockForm;
