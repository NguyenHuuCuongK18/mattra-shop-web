"use client";

import { useSearchParams, Link } from "react-router-dom";
import { Container, Card, Alert } from "react-bootstrap";
import Button from "../../components/ui/Button";

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const orderId = searchParams.get("orderId");
  // Tạm thời trạng thái luôn là pending
  const paymentStatus = "pending";

  const getStatusColor = () => "warning";
  const getStatusIcon = () => "bi-clock-fill";

  const getStatusMessage = () => (
    <>
      Thanh toán đang chờ xác nhận.
      <br />
      Chúng tôi sẽ xác nhận và gửi email cho bạn sớm nhất.
    </>
  );

  return (
    <Container className="py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <Card className="shadow-sm">
            <Card.Body className="text-center p-5">
              <div className="mb-4">
                <i
                  className={`${getStatusIcon()} display-1 text-${getStatusColor()}`}
                ></i>
              </div>

              <h2 className="mb-3">{getStatusMessage()}</h2>

              <div className="mb-4">
                <div className="bg-light p-3 rounded mb-3">
                  <div className="row text-start">
                    <div className="col-6">
                      <strong>Mã thanh toán:</strong>
                    </div>
                    <div className="col-6">
                      <code>{paymentId}</code>
                    </div>
                  </div>
                  <div className="row text-start">
                    <div className="col-6">
                      <strong>Mã đơn:</strong>
                    </div>
                    <div className="col-6">
                      <code>{orderId}</code>
                    </div>
                  </div>
                  <div className="row text-start">
                    <div className="col-6">
                      <strong>Trạng thái:</strong>
                    </div>
                    <div className="col-6">
                      <span className={`badge bg-${getStatusColor()}`}>
                        Đang chờ
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Alert variant="info" className="mb-4">
                <Alert.Heading className="h6">
                  <i className="bi bi-info-circle me-2"></i>
                  Đang xử lý thanh toán
                </Alert.Heading>
                <p className="mb-0">
                  Thanh toán của bạn đã được gửi và đang chờ đội ngũ chúng tôi
                  xác minh. Bạn sẽ nhận được email xác nhận khi thanh toán được
                  xác thực.
                </p>
              </Alert>

              <div className="d-grid gap-2">
                <Button as={Link} to="/" variant="primary">
                  Quay lại trang chủ
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </Container>
  );
};

export default PaymentResultPage;
