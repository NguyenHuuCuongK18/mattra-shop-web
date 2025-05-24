// src/pages/user/PaymentResultPage.js

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

/**
 * Parses the URL query string and returns an object of VNPay response params.
 */
function useQueryParams() {
  const { search } = useLocation();
  const [params, setParams] = useState({});
  useEffect(() => {
    const qp = new URLSearchParams(search);
    const entries = {};
    for (const [key, value] of qp.entries()) {
      entries[key] = value;
    }
    setParams(entries);
  }, [search]);
  return params;
}

const PaymentResultPage = () => {
  const query = useQueryParams();
  const navigate = useNavigate();

  // VNPay sends vnp_ResponseCode==='00' for success
  const isSuccess = query.vnp_ResponseCode === "00";

  return (
    <MainLayout>
      <div className="max-w-lg mx-auto my-8">
        <h1 className="text-3xl font-semibold mb-6 text-center">
          {isSuccess ? "🎉 Payment Successful" : "❌ Payment Failed"}
        </h1>

        <Card className="space-y-4">
          <div>
            <span className="font-medium">Order Ref:</span>{" "}
            {query.vnp_TxnRef || "N/A"}
          </div>
          <div>
            <span className="font-medium">Amount:</span>{" "}
            {query.vnp_Amount
              ? `${(Number(query.vnp_Amount) / 100).toLocaleString()} VND`
              : "N/A"}
          </div>
          <div>
            <span className="font-medium">Bank Code:</span>{" "}
            {query.vnp_BankCode || "N/A"}
          </div>
          <div>
            <span className="font-medium">Payment Date:</span>{" "}
            {query.vnp_PayDate || "N/A"}
          </div>
          <div>
            <span className="font-medium">Response Code:</span>{" "}
            {query.vnp_ResponseCode || "N/A"}
          </div>
          {query.vnp_ResponseMessage && (
            <div>
              <span className="font-medium">Message:</span>{" "}
              {query.vnp_ResponseMessage}
            </div>
          )}
        </Card>

        <div className="flex justify-center mt-6 space-x-4">
          <Button onClick={() => navigate("/orders")}>My Orders</Button>
          {!isSuccess && query.vnp_TxnRef && (
            <Button
              variant="outline"
              onClick={() =>
                navigate("/checkout", {
                  state: { retryTxnRef: query.vnp_TxnRef },
                })
              }
            >
              Retry Payment
            </Button>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default PaymentResultPage;
