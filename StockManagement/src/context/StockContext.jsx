import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { productApi, stockApi } from "../services/api";

const StockContext = createContext(null);

export const StockProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await productApi.getProducts();
      if (res.success) {
        setProducts(res.products || []);
      }
    } catch (e) {
      console.error("Failed to load products in StockProvider:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const recordIncomingStock = async ({ productId, quantity, date, remarks }) => {
    const res = await stockApi.incoming({ productId, quantity, date, remarks });
    if (res.success) {
      await refreshProducts();
    }
    return res;
  };

  const recordOutgoingStock = async ({ productId, quantity, department, date, remarks }) => {
    const res = await stockApi.outgoing({ productId, quantity, department, date, remarks });
    if (res.success) {
      await refreshProducts();
    }
    return res;
  };

  const addProduct = async (productData) => {
    const res = await productApi.createProduct(productData);
    if (res.success) {
      await refreshProducts();
    }
    return res;
  };

  return (
    <StockContext.Provider
      value={{
        products,
        loading,
        refreshProducts,
        recordIncomingStock,
        recordOutgoingStock,
        addProduct
      }}
    >
      {children}
    </StockContext.Provider>
  );
};

export const useStock = () => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error("useStock must be used within a StockProvider");
  }
  return context;
};

export default StockContext;
