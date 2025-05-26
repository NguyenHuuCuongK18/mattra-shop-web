"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container, Row, Col, Form, Alert, InputGroup } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { authAPI } from "../utils/api";

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    verificationCode: "",
    password: "",
    confirmPassword: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [codeError, setCodeError] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRequestCode = async () => {
    if (!formData.email) {
      setCodeError("Please enter your email first");
      return;
    }
    try {
      setCodeLoading(true);
      setCodeError("");
      await authAPI.requestEmailVerification(formData.email);
      setCodeSent(true);
    } catch (err) {
      setCodeError(err.response?.data?.message || "Failed to send code");
    } finally {
      setCodeLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (!formData.verificationCode) {
      setError("Verification code is required");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { confirmPassword, ...userData } = formData;
      await register(userData);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register");
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
              <h1 className="fs-4 fw-bold">Create Your Account</h1>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                {/* Username */}
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                {/* Full Name */}
                <Form.Group className="mb-3" controlId="name">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                {/* Email + Inline Request Code */}
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                    <Button
                      type="button"
                      onClick={handleRequestCode}
                      loading={codeLoading}
                      disabled={codeLoading}
                      size="sm"
                    >
                      {codeLoading ? "Sending..." : "Get Code"}
                    </Button>
                  </InputGroup>
                  {codeError && (
                    <div className="mt-1">
                      <small className="text-danger">{codeError}</small>
                    </div>
                  )}
                  {codeSent && (
                    <div className="mt-1">
                      <small className="text-success">
                        Code sent! Check your email.
                      </small>
                    </div>
                  )}
                </Form.Group>

                {/* Verification Code */}
                <Form.Group className="mb-3" controlId="verificationCode">
                  <Form.Label>Verification Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="verificationCode"
                    value={formData.verificationCode}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                {/* Password */}
                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                {/* Confirm Password */}
                <Form.Group className="mb-3" controlId="confirmPassword">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                {/* Address */}
                <Form.Group className="mb-4" controlId="address">
                  <Form.Label>Address (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </Form.Group>

                {/* Sign Up */}
                <Button
                  type="submit"
                  className="w-100"
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Sign up"}
                </Button>
              </Form>
            </Card.Body>
            <Card.Footer className="text-center bg-white py-3">
              <p className="mb-0">
                Already have an account?{" "}
                <Link to="/login" className="text-decoration-none">
                  Sign in
                </Link>
              </p>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default RegisterPage;
