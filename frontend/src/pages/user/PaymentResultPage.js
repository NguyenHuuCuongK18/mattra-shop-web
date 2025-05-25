"use client";

import { useSearchParams, Link } from "react-router-dom";
import { Container, Card, Alert } from "react-bootstrap";
import Button from "../../components/ui/Button";

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const orderId = searchParams.get("orderId");
  const paymentStatus = "pending";

  const getStatusColor = () => "warning";

  const getStatusIcon = () => "bi-clock-fill";

  const getStatusMessage = () => (
    <>
      Payment pending verification.
      <br />
      Our team will verify your payment and send a confirmation email soon.
    </>
  );

  return (
    <Container className="py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <Card className="shadow-sm">
            <Card.Body className="text-center p-5">
              <div className="mb-4">
                <i
                  className={`${getStatusIcon()} display-1 text-${getStatusColor()}`}
                ></i>
              </div>

              <h2 className="mb-3">{getStatusMessage()}</h2>

              <div className="mb-4">
                <div className="bg-light p-3 rounded mb-3">
                  <div className="row text-start">
                    <div className="col-6">
                      <strong>Payment ID:</strong>
                    </div>
                    <div className="col-6">
                      <code>{paymentId}</code>
                    </div>
                  </div>
                  <div className="row text-start">
                    <div className="col-6">
                      <strong>Order ID:</strong>
                    </div>
                    <div className="col-6">
                      <code>{orderId}</code>
                    </div>
                  </div>
                  <div className="row text-start">
                    <div className="col-6">
                      <strong>Status:</strong>
                    </div>
                    <div className="col-6">
                      <span className={`badge bg-${getStatusColor()}`}>
                        Pending
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Alert variant="info" className="mb-4">
                <Alert.Heading className="h6">
                  <i className="bi bi-info-circle me-2"></i>
                  Payment Processing
                </Alert.Heading>
                <p className="mb-0">
                  Your payment has been submitted and is awaiting verification
                  by our team. You will receive an email confirmation once the
                  payment is verified.
                </p>
              </Alert>

              <div className="d-grid gap-2">
                <Button
                  as={Link}
                  to={`/orders/${orderId}`}
                  variant="outline-secondary"
                >
                  View Order Details
                </Button>
                <Button as={Link} to="/orders" variant="outline-success">
                  View All Orders
                </Button>
                <Button as={Link} to="/" variant="primary">
                  Back to Home
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </Container>
  );
};

export default PaymentResultPage;
