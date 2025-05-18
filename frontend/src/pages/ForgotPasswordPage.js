"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Form, Alert } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (error) {
      console.error("Password reset request error:", error);
      setError(
        error.response?.data?.message || "Failed to send password reset email"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6} xl={5}>
          <Card>
            <Card.Header className="text-center bg-white py-3">
              <h1 className="fs-4 fw-bold">Forgot Password</h1>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}

              {success ? (
                <Alert variant="success">
                  <p className="mb-0">
                    Password reset instructions have been sent to your email.
                    Please check your inbox.
                  </p>
                </Alert>
              ) : (
                <Form onSubmit={handleSubmit}>
                  <p className="text-secondary mb-4">
                    Enter your email address and we'll send you instructions to
                    reset your password.
                  </p>

                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    className="w-100"
                    loading={loading}
                    disabled={loading}
                  >
                    Send Reset Link
                  </Button>
                </Form>
              )}
            </Card.Body>
            <Card.Footer className="text-center bg-white py-3">
              <p className="mb-0">
                Remember your password?{" "}
                <Link to="/login" className="text-decoration-none">
                  Back to Login
                </Link>
              </p>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ForgotPasswordPage;
