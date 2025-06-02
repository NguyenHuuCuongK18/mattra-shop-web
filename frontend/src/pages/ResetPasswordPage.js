// src/pages/ResetPasswordPage.js
"use client";

import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Container, Row, Col, Form, Alert } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Lấy token từ query parameter
    const searchParams = new URLSearchParams(location.search);
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError("Token đặt lại không hợp lệ hoặc bị thiếu");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu không khớp");
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      console.error("Lỗi khi đặt lại mật khẩu:", error);
      setError(error.response?.data?.message || "Đặt lại mật khẩu thất bại");
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
              <h1 className="fs-4 fw-bold">Đặt lại mật khẩu</h1>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}

              {success ? (
                <Alert variant="success">
                  <p className="mb-0">
                    Mật khẩu đã được đặt lại thành công! Bạn sẽ được chuyển
                    hướng đến trang đăng nhập.
                  </p>
                </Alert>
              ) : (
                <Form onSubmit={handleSubmit}>
                  <p className="text-secondary mb-4">
                    Nhập mật khẩu mới của bạn bên dưới.
                  </p>

                  <Form.Group className="mb-3">
                    <Form.Label>Mật khẩu mới</Form.Label>
                    <Form.Control
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Xác nhận mật khẩu mới</Form.Label>
                    <Form.Control
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    className="w-100"
                    loading={loading}
                    disabled={loading}
                  >
                    {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                  </Button>
                </Form>
              )}
            </Card.Body>
            <Card.Footer className="text-center bg-white py-3">
              <p className="mb-0">
                Bạn đã nhớ mật khẩu?{" "}
                <Link to="/login" className="text-decoration-none">
                  Quay lại Đăng nhập
                </Link>
              </p>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ResetPasswordPage;
