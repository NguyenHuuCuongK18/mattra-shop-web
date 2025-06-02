// src/pages/SubscriptionsPage.js
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
} from "../utils/api";
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
      } catch (err) {
        console.error("Lỗi khi tải gói đăng ký:", err);
        toast.error("Không thể tải gói đăng ký");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionPlans();
  }, []);

  const handleSubscribe = async (plan) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để đăng ký");
      navigate("/login");
      return;
    }

    setSelectedPlan(plan);
    setPaymentLoading(true);

    try {
      // Bước 1: Tạo đơn đăng ký
      const orderData = {
        subscriptionId: plan._id,
        paymentMethod: "Online Banking",
        shippingAddress: user.address || "Dịch vụ đăng ký",
      };

      const orderResponse = await subscriptionOrderAPI.createSubscriptionOrder(
        orderData
      );
      console.log("orderResponse:", orderResponse);

      if (!orderResponse.data?.order?._id) {
        throw new Error("Không tìm thấy order._id trong phản hồi");
      }
      const subscriptionOrderId = orderResponse.data.order._id;

      // Bước 2: Tạo VietQR cho thanh toán
      const paymentResponse = await subscriptionPaymentAPI.generateVietQR({
        subscriptionOrderId,
      });

      const { paymentId, paymentImgUrl, expiresAt } = paymentResponse.data;

      // Bước 3: Lưu thông tin thanh toán vào localStorage
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

      // Bước 4: Chuyển hướng đến trang thanh toán
      navigate(
        `/payment?paymentId=${paymentId}&orderId=${subscriptionOrderId}`
      );
    } catch (err) {
      console.error("Lỗi khi tạo đơn đăng ký:", err);
      toast.error(
        err.response?.data?.message || err.message || "Tạo đơn đăng ký thất bại"
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Đang tải gói đăng ký...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold">Gói Đăng Ký Trà</h1>
        <p className="lead text-secondary">
          Tham gia câu lạc bộ trà và nhận các loại trà thượng hạng được tuyển
          chọn, giao tận nơi mỗi tháng.
        </p>
      </div>

      {user?.subscription?.status === "active" ? (
        <Alert variant="success" className="mb-4">
          <div className="alert-heading h6 mb-2">
            <i className="bi bi-check-circle me-2"></i>
            Đăng ký đang hoạt động
          </div>
          <p className="mb-0">
            Bạn hiện có gói đăng ký ({user.subscription.subscriptionId?.name}).
            {user.subscription.endDate && (
              <>
                {" "}
                Nó sẽ hết hạn vào{" "}
                {new Date(user.subscription.endDate).toLocaleDateString(
                  "vi-VN",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
                .
              </>
            )}
          </p>
        </Alert>
      ) : (
        <Alert variant="info" className="mb-4">
          <p className="mb-0">
            Chưa có gói đăng ký. Khám phá các gói bên dưới.
          </p>
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
                      Phổ biến nhất
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
                      {plan.price.toLocaleString("vi-VN")} VND
                    </span>
                    <span className="text-secondary">
                      /{plan.duration} tháng
                    </span>
                  </div>
                  <div className="mb-4 flex-grow-1">
                    <p className="text-muted">
                      {plan.description || "Dịch vụ đăng ký trà thượng hạng"}
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
                        <span className="ms-2">Đang xử lý...</span>
                      </>
                    ) : user?.subscription?.status === "active" ? (
                      "Xem các gói"
                    ) : (
                      "Đăng ký ngay"
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
              <h3 className="mt-3">Chưa có gói đăng ký nào</h3>
              <p className="text-muted">
                Vui lòng quay lại sau để xem các gói sẵn có.
              </p>
            </div>
          </Col>
        )}
      </Row>

      <div className="bg-light rounded p-4 mt-5">
        <h3 className="fs-4 fw-semibold mb-3">Cách Thức Hoạt Động</h3>
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
                <h4 className="fs-5 fw-semibold">Chọn Gói</h4>
                <p className="text-secondary mb-0">
                  Chọn gói phù hợp với thói quen uống trà của bạn.
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
                <h4 className="fs-5 fw-semibold">Thực Hiện Thanh Toán</h4>
                <p className="text-secondary mb-0">
                  Hoàn tất thanh toán bằng hệ thống VietQR an toàn của chúng
                  tôi.
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
                <h4 className="fs-5 fw-semibold">Tận Hưởng Trà Thượng Hạng</h4>
                <p className="text-secondary mb-0">
                  Nhận các quyền lợi độc quyền và lựa chọn trà thượng hạng.
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
