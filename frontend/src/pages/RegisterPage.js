"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container, Row, Col, Form, Alert, InputGroup } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { authAPI } from "../utils/api";

/**
 * Renders the user registration page with a form for account creation, including email verification and phone number validation.
 *
 * The form collects username, full name, email, phone number, verification code, password, confirm password, and an optional address. Users must request and enter an email verification code before registering. The phone number must be 10 or 11 digits. Displays validation and API error messages as needed, and navigates to the home page upon successful registration.
 */
function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    phone: "",
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
      setCodeError("Vui lòng nhập email trước");
      return;
    }
    try {
      setCodeLoading(true);
      setCodeError("");
      await authAPI.requestEmailVerification(formData.email);
      setCodeSent(true);
    } catch (err) {
      setCodeError(err.response?.data?.message || "Gửi mã thất bại");
    } finally {
      setCodeLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu không khớp");
      return;
    }
    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (!formData.verificationCode) {
      setError("Mã xác thực là bắt buộc");
      return;
    }
    if (!formData.phone) {
      setError("Số điện thoại là bắt buộc");
      return;
    }
    if (!/^\d{10,11}$/.test(formData.phone)) {
      setError("Số điện thoại không hợp lệ (10-11 chữ số)");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { confirmPassword, ...userData } = formData;
      await register(userData);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Đăng ký thất bại");
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
              <h1 className="fs-4 fw-bold">Tạo tài khoản</h1>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                {/* Username */}
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label>Tên đăng nhập</Form.Label>
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
                  <Form.Label>Họ và tên</Form.Label>
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
                      {codeLoading ? "Đang gửi..." : "Lấy mã"}
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
                        Mã đã được gửi! Vui lòng kiểm tra email.
                      </small>
                    </div>
                  )}
                </Form.Group>

                {/* Verification Code */}
                <Form.Group className="mb-3" controlId="verificationCode">
                  <Form.Label>Mã xác thực</Form.Label>
                  <Form.Control
                    type="text"
                    name="verificationCode"
                    value={formData.verificationCode}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                {/* Phone */}
                <Form.Group className="mb-3" controlId="phone">
                  <Form.Label>Số điện thoại</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="Nhập số điện thoại (10-11 chữ số)"
                  />
                </Form.Group>

                {/* Password */}
                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>Mật khẩu</Form.Label>
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
                  <Form.Label>Xác nhận mật khẩu</Form.Label>
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
                  <Form.Label>Địa chỉ (Tùy chọn)</Form.Label>
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
                  {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
                </Button>
              </Form>
            </Card.Body>
            <Card.Footer className="text-center bg-white py-3">
              <p className="mb-0">
                Đã có tài khoản?{" "}
                <Link to="/login" className="text-decoration-none">
                  Đăng nhập
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
