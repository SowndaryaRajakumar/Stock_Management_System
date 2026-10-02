import React from "react";
import Layout from "../components/layout/Layout";
import OutgoingStockForm from "../components/stock/OutgoingStockForm";

export const OutgoingStock = () => {
  return (
    <Layout
      title="Outgoing Stock"
      breadcrumb="Issue stock to an academic or administrative department"
    >
      <OutgoingStockForm />
    </Layout>
  );
};

export default OutgoingStock;
