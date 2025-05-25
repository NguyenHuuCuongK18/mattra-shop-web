"use client";

import Alert from "../components/ui/Alert";
import { useState, useEffect } from "react";
import { Container, Row, Col, Badge, Modal, Spinner } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { subscriptionAPI, paymentAPI } from "../utils/api";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { toast } from "react-hot-toast";

function SubscriptionsPage() {
  const { user } = useAuth();
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [paymentId, setPaymentId] = useState(null);

  useEffect(() => {
    const fetchSubscriptionPlans = async () => {
      try {
        const response = await subscriptionAPI.getAllSubscriptions();
        setSubscriptionPlans(response.data.subscriptions || []);
      } catch (error) {
        console.error("Error fetching subscription plans:", error);
        toast.error("Failed to load subscription plans");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionPlans();
  }, []);

  const handleSubscribe = async (plan) => {
    if (!user) {
      toast.error("Please login to subscribe");
      return;
    }

    setSelectedPlan(plan);
    setPaymentLoading(true);
    setShowPaymentModal(true);

    try {
      // Create a temporary order for subscription payment
      const orderData = {
        paymentMethod: "Online Banking",
        shippingAddress: user.address || "Subscription Service",
        selectedItems: [], // Empty for subscription
        subscriptionId: plan._id || plan.id,
        isSubscription: true,
      };

      // Note: You might need to create a special subscription order endpoint
      // For now, we'll use the payment API directly
      const paymentResponse = await paymentAPI.generateVietQR({
        orderId: `subscription_${plan._id || plan.id}_${Date.now()}`,
        amount: plan.price,
      });

      setQrCode(paymentResponse.data.qrCode);
      setPaymentId(paymentResponse.data.paymentId);
    } catch (error) {
      console.error("Error creating subscription payment:", error);
      toast.error("Failed to create payment. Please try again.");
      setShowPaymentModal(false);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentComplete = () => {
    setShowPaymentModal(false);
    setQrCode(null);
    setPaymentId(null);
    setSelectedPlan(null);

    // Redirect to payment result page
    if (paymentId) {
      window.location.href = `/payment/result?paymentId=${paymentId}&type=subscription`;
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading subscription plans...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold">Tea Subscription Plans</h1>
        <p className="lead text-secondary">
          Join our tea club and receive a curated selection of premium teas
          delivered to your door every month.
        </p>
      </div>

      {user?.subscription?.status === "active" && (
        <Alert variant="success" className="mb-4">
          <Alert.Heading className="h6">
            <i className="bi bi-check-circle me-2"></i>
            Active Subscription
          </Alert.Heading>
          <p className="mb-0">
            You currently have an active subscription.
            {user.subscription.endDate && (
              <>
                {" "}
                It will expire on{" "}
                {new Date(user.subscription.endDate).toLocaleDateString()}.
              </>
            )}
          </p>
        </Alert>
      )}

      <Row className="justify-content-center">
        {subscriptionPlans.length > 0 ? (
          subscriptionPlans.map((plan, index) => (
            <Col key={plan._id || plan.id} md={6} lg={4} className="mb-4">
              <Card className={`h-100 ${index === 1 ? "border-success" : ""}`}>
                {index === 1 && (
                  <div className="position-absolute top-0 start-50 translate-middle">
                    <Badge bg="success" className="py-2 px-3">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <Card.Header
                  className={`text-center py-3 ${
                    index === 1 ? "bg-success text-white" : ""
                  }`}
                >
                  <h2 className="fs-4 fw-bold mb-0">{plan.name}</h2>
                </Card.Header>
                <Card.Body className="d-flex flex-column">
                  <div className="text-center mb-4">
                    <span className="display-5 fw-bold">
                      ${plan.price.toFixed(2)}
                    </span>
                    <span className="text-secondary">
                      /{plan.duration} days
                    </span>
                  </div>

                  <div className="mb-4 flex-grow-1">
                    <p className="text-muted">
                      {plan.description || "Premium tea subscription service"}
                    </p>

                    {plan.perks && plan.perks.length > 0 && (
                      <ul className="list-unstyled">
                        {plan.perks.map((perk, perkIndex) => (
                          <li
                            key={perkIndex}
                            className="mb-2 d-flex align-items-center"
                          >
                            <i className="bi bi-check-circle-fill text-success me-2"></i>
                            {perk}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <Button
                    variant={index === 1 ? "success" : "outline-success"}
                    className="w-100"
                    onClick={() => handleSubscribe(plan)}
                    disabled={user?.subscription?.status === "active"}
                  >
                    {user?.subscription?.status === "active"
                      ? "Already Subscribed"
                      : "Subscribe Now"}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col className="text-center">
            <div className="py-5">
              <i className="bi bi-box-seam display-1 text-muted"></i>
              <h3 className="mt-3">No Subscription Plans Available</h3>
              <p className="text-muted">
                Please check back later for available plans.
              </p>
            </div>
          </Col>
        )}
      </Row>

      <div className="bg-light rounded p-4 mt-5">
        <h3 className="fs-4 fw-semibold mb-3">How It Works</h3>
        <Row>
          <Col md={4} className="mb-3 mb-md-0">
            <div className="d-flex">
              <div
                className="bg-success rounded-circle text-white d-flex align-items-center justify-content-center me-3"
                style={{ width: "40px", height: "40px" }}
              >
                1
              </div>
              <div>
                <h4 className="fs-5 fw-semibold">Choose a Plan</h4>
                <p className="text-secondary mb-0">
                  Select the subscription that fits your tea drinking habits.
                </p>
              </div>
            </div>
          </Col>
          <Col md={4} className="mb-3 mb-md-0">
            <div className="d-flex">
              <div
                className="bg-success rounded-circle text-white d-flex align-items-center justify-content-center me-3"
                style={{ width: "40px", height: "40px" }}
              >
                2
              </div>
              <div>
                <h4 className="fs-5 fw-semibold">Make Payment</h4>
                <p className="text-secondary mb-0">
                  Complete your payment using our secure VietQR system.
                </p>
              </div>
            </div>
          </Col>
          <Col md={4}>
            <div className="d-flex">
              <div
                className="bg-success rounded-circle text-white d-flex align-items-center justify-content-center me-3"
                style={{ width: "40px", height: "40px" }}
              >
                3
              </div>
              <div>
                <h4 className="fs-5 fw-semibold">Enjoy Premium Tea</h4>
                <p className="text-secondary mb-0">
                  Receive exclusive benefits and premium tea selections.
                </p>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* Payment Modal */}
      <Modal
        show={showPaymentModal}
        onHide={() => setShowPaymentModal(false)}
        centered
        size="md"
      >
        <Modal.Header closeButton>
          <Modal.Title>Complete Subscription Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {paymentLoading ? (
            <div className="py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Generating payment QR code...</p>
            </div>
          ) : qrCode ? (
            <div>
              <h5 className="mb-3">Scan QR Code to Pay</h5>
              <div className="mb-3">
                <img
                  src={qrCode || "/placeholder.svg"}
                  alt="Payment QR Code"
                  className="img-fluid"
                  style={{ maxWidth: "300px" }}
                />
              </div>
              <div className="bg-light p-3 rounded mb-3">
                <div className="row">
                  <div className="col-6 text-start">
                    <strong>Plan:</strong>
                  </div>
                  <div className="col-6 text-end">{selectedPlan?.name}</div>
                </div>
                <div className="row">
                  <div className="col-6 text-start">
                    <strong>Duration:</strong>
                  </div>
                  <div className="col-6 text-end">
                    {selectedPlan?.duration} days
                  </div>
                </div>
                <div className="row">
                  <div className="col-6 text-start">
                    <strong>Amount:</strong>
                  </div>
                  <div className="col-6 text-end">
                    <strong>${selectedPlan?.price.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
              <p className="text-muted small">
                Use your banking app to scan this QR code and complete the
                payment. After payment, click the button below to verify your
                payment status.
              </p>
            </div>
          ) : (
            <div className="py-4">
              <i className="bi bi-exclamation-triangle display-1 text-warning"></i>
              <p className="mt-3">
                Failed to generate payment QR code. Please try again.
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowPaymentModal(false)}
          >
            Cancel
          </Button>
          {qrCode && (
            <Button variant="primary" onClick={handlePaymentComplete}>
              I've Made the Payment
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default SubscriptionsPage;
