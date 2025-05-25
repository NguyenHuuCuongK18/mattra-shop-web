"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Card, Alert, Spinner } from "react-bootstrap";
import Button from "../../components/ui/Button";
import { toast } from "react-hot-toast";

const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);

  const paymentId = searchParams.get("paymentId");
  const orderId = searchParams.get("orderId");

  // Load payment data
  useEffect(() => {
    const loadPaymentData = () => {
      // Try to get from localStorage first
      const storedPayment = localStorage.getItem("currentPayment");
      if (storedPayment) {
        try {
          const parsed = JSON.parse(storedPayment);
          if (parsed.paymentId === paymentId) {
            setPaymentData(parsed);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error parsing stored payment data:", error);
        }
      }

      // If no stored data or mismatch, redirect back
      if (!paymentId || !orderId) {
        toast.error("Invalid payment session");
        navigate("/");
        return;
      }

      setLoading(false);
    };

    loadPaymentData();
  }, [paymentId, orderId, navigate]);

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <h3 className="mt-3">Loading Payment...</h3>
        </div>
      </Container>
    );
  }

  if (!paymentData) {
    return (
      <Container className="py-5">
        <Card className="text-center">
          <Card.Body>
            <h3>Payment Session Not Found</h3>
            <p>Unable to load payment information.</p>
            <Button as={Link} to="/" variant="primary">
              Back to Home
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white text-center">
              <h4 className="mb-0">
                <i className="bi bi-qr-code me-2"></i>
                Complete Your Payment
              </h4>
            </Card.Header>
            <Card.Body className="p-4">
              {/* QR Code */}
              <div className="text-center mb-4">
                <div className="bg-light p-3 rounded d-inline-block">
                  <img
                    src={paymentData.paymentImgUrl || "/placeholder.svg"}
                    alt="Payment QR Code"
                    className="img-fluid"
                    style={{ maxWidth: "250px", height: "auto" }}
                  />
                </div>
              </div>

              {/* Payment Instructions */}
              <Alert variant="info" className="mb-4">
                <Alert.Heading className="h6">
                  <i className="bi bi-info-circle me-2"></i>
                  Payment Instructions
                </Alert.Heading>
                <p>
                  Please complete your payment by scanning the QR code below.
                  Once you've made the payment, our team will verify it and send
                  you a confirmation email.
                </p>
                <ol className="mb-0 small">
                  <li>Open your banking app</li>
                  <li>Scan the QR code above</li>
                  <li>
                    Confirm the payment amount:{" "}
                    <strong>${paymentData.amount?.toFixed(2)}</strong>
                  </li>
                  <li>Complete the transaction</li>
                  <li>Click "Proceed" to continue</li>
                </ol>
              </Alert>

              {/* Payment Details */}
              <div className="bg-light p-3 rounded mb-4">
                <div className="row text-sm">
                  <div className="col-6">
                    <strong>Order ID:</strong>
                  </div>
                  <div className="col-6">
                    <code>{orderId}</code>
                  </div>
                  <div className="col-6">
                    <strong>Payment ID:</strong>
                  </div>
                  <div className="col-6">
                    <code>{paymentId}</code>
                  </div>
                  <div className="col-6">
                    <strong>Amount:</strong>
                  </div>
                  <div className="col-6">${paymentData.amount?.toFixed(2)}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-grid gap-2">
                <Button
                  as={Link}
                  to={`/payment/result?paymentId=${paymentId}&orderId=${orderId}&status=pending`}
                  variant="success"
                  size="lg"
                >
                  <i className="bi bi-arrow-right-circle me-2"></i>
                  Proceed
                </Button>

                <Button
                  as={Link}
                  to={`/orders/${orderId}`}
                  variant="outline-secondary"
                >
                  View Order Details
                </Button>

                <Button as={Link} to="/" variant="outline-primary">
                  Back to Home
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PaymentPage;
