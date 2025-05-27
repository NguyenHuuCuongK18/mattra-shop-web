"use client";

import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { Container, Row, Col, Badge, Spinner } from "react-bootstrap";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  subscriptionAPI,
  subscriptionOrderAPI,
  subscriptionPaymentAPI,
} from "../utils/api"; // Use subscription-specific APIs
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function SubscriptionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

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
      navigate("/login");
      return;
    }

    setSelectedPlan(plan);
    setPaymentLoading(true);

    try {
      // Step 1: Create subscription order
      const orderData = {
        subscriptionId: plan._id,
        paymentMethod: "Online Banking",
        shippingAddress: user.address || "Subscription Service",
      };

      const orderResponse = await subscriptionOrderAPI.createSubscriptionOrder(
        orderData
      );
      console.log("orderResponse:", orderResponse); // Debug log
      if (!orderResponse.data?.order?._id) {
        throw new Error("Invalid response structure: order._id not found");
      }
      const subscriptionOrderId = orderResponse.data.order._id; // Changed from subscriptionOrder to order

      // Step 2: Generate VietQR code for subscription payment
      const paymentResponse = await subscriptionPaymentAPI.generateVietQR({
        subscriptionOrderId,
      });

      const { paymentId, paymentImgUrl, expiresAt } = paymentResponse.data;

      // Step 3: Store payment info in localStorage
      localStorage.setItem(
        "currentPayment",
        JSON.stringify({
          paymentId,
          paymentImgUrl,
          expiresAt,
          orderId: subscriptionOrderId,
          amount: plan.price,
          type: "subscription",
        })
      );

      // Step 4: Navigate to payment page
      navigate(
        `/payment?paymentId=${paymentId}&orderId=${subscriptionOrderId}`
      );
    } catch (error) {
      console.error("Error creating subscription payment:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create subscription order"
      );
    } finally {
      setPaymentLoading(false);
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

      {user?.subscription?.status === "active" ? (
        <Alert variant="success" className="mb-4">
          <div className="alert-heading h6 mb-2">
            <i className="bi bi-check-circle me-2"></i>
            Active Subscription
          </div>
          <p className="mb-0">
            You currently have an active subscription (
            {user.subscription.subscriptionId?.name}).
            {user.subscription.endDate && (
              <>
                {" "}
                It will expire on{" "}
                {new Date(user.subscription.endDate).toLocaleDateString()}.
              </>
            )}
          </p>
        </Alert>
      ) : (
        <Alert variant="info" className="mb-4">
          <p className="mb-0">No active subscription. Explore plans below.</p>
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
                      /{plan.duration} month{plan.duration > 1 ? "s" : ""}
                    </span>{" "}
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
                    disabled={paymentLoading}
                  >
                    {paymentLoading && selectedPlan?._id === plan._id ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />
                        <span className="ms-2">Processing...</span>
                      </>
                    ) : user?.subscription?.status === "active" ? (
                      "View Plans"
                    ) : (
                      "Subscribe Now"
                    )}
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
    </Container>
  );
}

export default SubscriptionsPage;
