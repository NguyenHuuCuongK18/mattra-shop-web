"use client";

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Container, Row, Col, Form, Alert } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

function LoginPage() {
  const [identification, setIdentification] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!identification || !password) {
      setError("Please enter both email/username and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Pass credentials as an object
      const credentials = { identification, password };
      console.log("Login payload:", credentials); // Debug
      await login(credentials);
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      setError(error.response?.data?.message || "Failed to login");
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
              <h1 className="fs-4 fw-bold">Login to Your Account</h1>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Email or Username</Form.Label>
                  <Form.Control
                    type="text"
                    value={identification}
                    onChange={(e) => setIdentification(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <Form.Check
                    type="checkbox"
                    id="remember-me"
                    label="Remember me"
                  />
                  <Link to="/forgot-password" className="text-decoration-none">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-100"
                  loading={loading}
                  disabled={loading}
                >
                  Sign in
                </Button>
              </Form>
            </Card.Body>
            <Card.Footer className="text-center bg-white py-3">
              <p className="mb-0">
                Don't have an account?{" "}
                <Link to="/register" className="text-decoration-none">
                  Sign up
                </Link>
              </p>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default LoginPage;
