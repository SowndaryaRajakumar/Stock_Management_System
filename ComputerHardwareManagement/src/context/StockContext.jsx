import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { productApi, stockApi } from "../services/api";
import { useSystem } from "./SystemContext";

const StockContext = createContext(null);

export const StockProvider = ({ children }) => {
  const { activeSystem } = useSystem();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshProducts = useCallback(async () => {
    if (!activeSystem) return;
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
  }, [activeSystem]);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => {
      const isAct = p.active !== false && p.status !== 'INACTIVE';
      const current = Number(p.currentQuantity !== undefined ? p.currentQuantity : (p.current_quantity || 0));
      const min = Number(
        p.minimumQuantity !== undefined
          ? p.minimumQuantity
          : (p.minimumStockLevel !== undefined ? p.minimumStockLevel : (p.minimum_quantity || 0))
      );
      return isAct && current <= min;
    }).length;
  }, [products]);

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
        lowStockCount,
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
