"use client";

import { useState } from "react";
import { Container, Row, Col, Badge } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

function SubscriptionsPage() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);

  const subscriptionPlans = [
    {
      id: "basic",
      name: "Basic",
      price: 9.99,
      interval: "month",
      features: [
        "Monthly tea box (2 varieties)",
        "Basic brewing guide",
        "Newsletter subscription",
      ],
      popular: false,
    },
    {
      id: "premium",
      name: "Premium",
      price: 19.99,
      interval: "month",
      features: [
        "Monthly tea box (4 varieties)",
        "Premium brewing guide",
        "Newsletter subscription",
        "Exclusive member discounts",
        "Early access to new products",
      ],
      popular: true,
    },
    {
      id: "ultimate",
      name: "Ultimate",
      price: 29.99,
      interval: "month",
      features: [
        "Monthly tea box (6 varieties)",
        "Premium brewing guide",
        "Newsletter subscription",
        "Exclusive member discounts",
        "Early access to new products",
        "Quarterly tea accessories",
        "Virtual tea tasting sessions",
      ],
      popular: false,
    },
  ];

  const handleSubscribe = (planId) => {
    setSelectedPlan(planId);
    // In a real application, this would redirect to a checkout page
    // or open a payment modal
    alert(
      `You selected the ${planId} plan. In a real app, this would proceed to checkout.`
    );
  };

  return (
    <Container className="py-5">
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold">Tea Subscription Plans</h1>
        <p className="lead text-secondary">
          Join our tea club and receive a curated selection of premium teas
          delivered to your door every month.
        </p>
      </div>

      <Row className="justify-content-center">
        {subscriptionPlans.map((plan) => (
          <Col key={plan.id} md={6} lg={4} className="mb-4">
            <Card className={`h-100 ${plan.popular ? "border-success" : ""}`}>
              {plan.popular && (
                <div className="position-absolute top-0 start-50 translate-middle">
                  <Badge bg="success" className="py-2 px-3">
                    Most Popular
                  </Badge>
                </div>
              )}
              <Card.Header
                className={`text-center py-3 ${
                  plan.popular ? "bg-success text-white" : ""
                }`}
              >
                <h2 className="fs-4 fw-bold mb-0">{plan.name}</h2>
              </Card.Header>
              <Card.Body className="d-flex flex-column">
                <div className="text-center mb-4">
                  <span className="display-5 fw-bold">${plan.price}</span>
                  <span className="text-secondary">/{plan.interval}</span>
                </div>

                <ul className="list-unstyled mb-4 flex-grow-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="mb-2 d-flex align-items-center">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.popular ? "success" : "outline-success"}
                  className="w-100"
                  onClick={() => handleSubscribe(plan.id)}
                >
                  Subscribe Now
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
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
                <h4 className="fs-5 fw-semibold">Receive Monthly Box</h4>
                <p className="text-secondary mb-0">
                  Get a curated selection of teas delivered to your door.
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
                  Brew and enjoy your premium tea selection.
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
