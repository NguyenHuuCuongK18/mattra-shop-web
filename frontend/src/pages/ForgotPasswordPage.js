// src/pages/ForgotPasswordPage.js
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
      setError("Vui lòng nhập địa chỉ email");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu đặt lại mật khẩu:", error);
      setError(
        error.response?.data?.message || "Gửi email đặt lại mật khẩu thất bại"
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
              <h1 className="fs-4 fw-bold">Quên Mật Khẩu</h1>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}

              {success ? (
                <Alert variant="success">
                  <p className="mb-0">
                    Hướng dẫn đặt lại mật khẩu đã được gửi tới email của bạn.
                    Vui lòng kiểm tra hộp thư.
                  </p>
                </Alert>
              ) : (
                <Form onSubmit={handleSubmit}>
                  <p className="text-secondary mb-4">
                    Nhập địa chỉ email của bạn và chúng tôi sẽ gửi hướng dẫn để
                    đặt lại mật khẩu.
                  </p>

                  <Form.Group className="mb-3">
                    <Form.Label>Địa chỉ Email</Form.Label>
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
                    {loading ? "Đang gửi..." : "Gửi liên kết đặt lại"}
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

export default ForgotPasswordPage;
