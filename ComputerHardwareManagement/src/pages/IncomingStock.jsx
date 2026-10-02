import React from "react";
import Layout from "../components/layout/Layout";
import IncomingStockForm from "../components/stock/IncomingStockForm";

export const IncomingStock = () => {
  return (
    <Layout
      title="Incoming Stock"
      breadcrumb="Record stock received into the store"
    >
      <IncomingStockForm />
    </Layout>
  );
};

export default IncomingStock;
