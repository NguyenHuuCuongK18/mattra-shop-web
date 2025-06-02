"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Card, Alert, Spinner } from "react-bootstrap";
import Button from "../../components/ui/Button";
import { toast } from "react-hot-toast";

const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);

  const paymentId = searchParams.get("paymentId");
  const orderId = searchParams.get("orderId");

  // Load payment data
  useEffect(() => {
    const loadPaymentData = () => {
      const storedPayment = localStorage.getItem("currentPayment");
      if (storedPayment) {
        try {
          const parsed = JSON.parse(storedPayment);
          if (parsed.paymentId === paymentId) {
            setPaymentData(parsed);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Lỗi khi parse dữ liệu thanh toán:", error);
        }
      }

      // Nếu không có dữ liệu hoặc mismatch, chuyển hướng về trang chủ
      if (!paymentId || !orderId) {
        toast.error("Phiên thanh toán không hợp lệ");
        navigate("/");
        return;
      }

      setLoading(false);
    };

    loadPaymentData();
  }, [paymentId, orderId, navigate]);

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <h3 className="mt-3">Đang tải thông tin thanh toán...</h3>
        </div>
      </Container>
    );
  }

  if (!paymentData) {
    return (
      <Container className="py-5">
        <Card className="text-center">
          <Card.Body>
            <h3>Không tìm thấy phiên thanh toán</h3>
            <p>Không thể tải thông tin thanh toán.</p>
            <Button as={Link} to="/" variant="primary">
              Quay lại trang chủ
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white text-center">
              <h4 className="mb-0">
                <i className="bi bi-qr-code me-2"></i>
                Hoàn tất thanh toán
              </h4>
            </Card.Header>
            <Card.Body className="p-4">
              {/* Mã QR */}
              <div className="text-center mb-4">
                <div className="bg-light p-3 rounded d-inline-block">
                  <img
                    src={paymentData.paymentImgUrl || "/placeholder.svg"}
                    alt="Mã QR thanh toán"
                    className="img-fluid"
                    style={{ maxWidth: "250px", height: "auto" }}
                  />
                </div>
              </div>

              {/* Hướng dẫn thanh toán */}
              <Alert variant="info" className="mb-4">
                <Alert.Heading className="h6">
                  <i className="bi bi-info-circle me-2"></i>
                  Hướng dẫn thanh toán
                </Alert.Heading>
                <p>
                  Vui lòng hoàn tất thanh toán bằng cách quét mã QR ở trên. Sau
                  khi bạn thanh toán, chúng tôi sẽ xác nhận và gửi email cho
                  bạn.
                </p>
                <ol className="mb-0 small">
                  <li>Mở ứng dụng ngân hàng trên điện thoại</li>
                  <li>Quét mã QR ở trên</li>
                  <li>
                    Xác nhận số tiền:{" "}
                    <strong>
                      {paymentData.amount.toLocaleString("vi-VN")} VND
                    </strong>
                  </li>
                  <li>Hoàn tất giao dịch</li>
                  <li>Nhấn “Tiếp tục” để hoàn thành quy trình</li>
                </ol>
              </Alert>

              {/* Thông tin thanh toán */}
              <div className="bg-light p-3 rounded mb-4">
                <div className="row text-sm">
                  <div className="col-6">
                    <strong>Mã đơn:</strong>
                  </div>
                  <div className="col-6">
                    <code>{orderId}</code>
                  </div>
                  <div className="col-6">
                    <strong>Mã thanh toán:</strong>
                  </div>
                  <div className="col-6">
                    <code>{paymentId}</code>
                  </div>
                  <div className="col-6">
                    <strong>Số tiền:</strong>
                  </div>
                  <div className="col-6">
                    {paymentData.amount.toLocaleString("vi-VN")} VND
                  </div>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="d-grid gap-2">
                <Button
                  as={Link}
                  to={`/payment/result?paymentId=${paymentId}&orderId=${orderId}&status=pending`}
                  variant="success"
                  size="lg"
                >
                  <i className="bi bi-arrow-right-circle me-2"></i>
                  Tiếp tục
                </Button>
                <Button as={Link} to="/" variant="outline-primary">
                  Quay lại trang chủ
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PaymentPage;
