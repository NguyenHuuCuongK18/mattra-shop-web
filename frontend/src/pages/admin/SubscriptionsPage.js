"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Badge,
  Form,
  InputGroup,
  Tabs,
  Tab,
  Modal,
  Row,
  Col,
} from "react-bootstrap";
import {
  subscriptionAPI,
  authAPI,
  subscriptionOrderAPI,
} from "../../utils/api";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { toast } from "react-hot-toast";
import Alert from "../../components/ui/Alert";

function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState("plans");
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showSubscriberModal, setShowSubscriberModal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [currentSubscriber, setCurrentSubscriber] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("subscriber");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [planFormData, setPlanFormData] = useState({
    name: "",
    price: "",
    duration: "",
    description: "",
  });
  const [userSubscriptionFormData, setUserSubscriptionFormData] = useState({
    userId: "",
    subscriptionId: "",
    status: "active",
    startDate: new Date().toISOString().split("T")[0],
  });
  const [subscriptionOrders, setSubscriptionOrders] = useState([]);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [plansResponse, usersResponse, ordersResponse] =
          await Promise.all([
            subscriptionAPI.getAllSubscriptions(),
            authAPI.getAllUsers(),
            subscriptionOrderAPI.getAllSubscriptionOrders(),
          ]);

        setSubscriptionPlans(plansResponse.data.subscriptions || []);
        setUsers(usersResponse.data.users || []);
        setSubscribers(usersResponse.data.users || []);
        setSubscriptionOrders(ordersResponse.data.orders || []);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
        toast.error("Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePlanInputChange = (e) => {
    const { name, value } = e.target;
    setPlanFormData({
      ...planFormData,
      [name]: value,
    });
  };

  const handleUserSubscriptionInputChange = (e) => {
    const { name, value } = e.target;
    setUserSubscriptionFormData({
      ...userSubscriptionFormData,
      [name]: value,
    });
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);

    try {
      const payload = {
        ...planFormData,
        price: Number.parseFloat(planFormData.price),
        duration: Number.parseInt(planFormData.duration),
      };

      const response = await subscriptionAPI.createSubscription(payload);

      setSubscriptionPlans([...subscriptionPlans, response.data.subscription]);
      setShowPlanModal(false);
      setPlanFormData({
        name: "",
        price: "",
        duration: "",
        description: "",
      });
      toast.success("Tạo gói đăng ký thành công");
    } catch (error) {
      console.error("Lỗi khi tạo gói đăng ký:", error);
      const errorMsg =
        error.response?.data?.message || "Không thể tạo gói đăng ký";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    if (!currentPlan) {
      setError("Chưa chọn gói đăng ký.");
      toast.error("Chưa chọn gói đăng ký.");
      setFormSubmitting(false);
      return;
    }

    const planId = currentPlan._id || currentPlan.id;
    if (!planId) {
      setError("ID gói đăng ký không hợp lệ.");
      toast.error("ID gói đăng ký không hợp lệ.");
      setFormSubmitting(false);
      return;
    }

    setFormSubmitting(true);

    try {
      const payload = {
        ...planFormData,
        price: Number.parseFloat(planFormData.price),
        duration: Number.parseInt(planFormData.duration),
      };

      const response = await subscriptionAPI.updateSubscription(
        planId,
        payload
      );

      setSubscriptionPlans(
        subscriptionPlans.map((plan) =>
          (plan._id || plan.id) === planId ? response.data.subscription : plan
        )
      );
      setShowPlanModal(false);
      toast.success("Cập nhật gói đăng ký thành công");
    } catch (error) {
      console.error("Lỗi khi cập nhật gói đăng ký:", error);
      const errorMsg =
        error.response?.data?.message || "Không thể cập nhật gói đăng ký";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm("Bạn có chắc muốn xóa gói đăng ký này?")) return;

    try {
      await subscriptionAPI.deleteSubscription(planId);
      setSubscriptionPlans(
        subscriptionPlans.filter((plan) => (plan._id || plan.id) !== planId)
      );
      toast.success("Xóa gói đăng ký thành công");
    } catch (error) {
      console.error("Lỗi khi xóa gói đăng ký:", error);
      const errorMsg =
        error.response?.data?.message || "Không thể xóa gói đăng ký";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleAssignSubscription = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);

    try {
      const { userId, subscriptionId, status, startDate } =
        userSubscriptionFormData;
      if (!userId || !subscriptionId) {
        throw new Error("Phải chọn Người dùng và Gói đăng ký.");
      }

      const response = await authAPI.updateSubscriptionStatus(userId, {
        subscriptionId,
        status,
        startDate: new Date(startDate).toISOString(),
      });

      const updatedUser = response.data.user;
      const existingIndex = subscribers.findIndex(
        (sub) => (sub._id || sub.id) === (updatedUser._id || updatedUser.id)
      );

      if (existingIndex >= 0) {
        setSubscribers([
          ...subscribers.slice(0, existingIndex),
          updatedUser,
          ...subscribers.slice(existingIndex + 1),
        ]);
      } else {
        setSubscribers([...subscribers, updatedUser]);
      }

      setUsers([
        ...users.map((user) =>
          (user._id || user.id) === (updatedUser._id || updatedUser.id)
            ? updatedUser
            : user
        ),
      ]);

      setShowSubscriberModal(false);
      setUserSubscriptionFormData({
        userId: "",
        subscriptionId: "",
        status: "active",
        startDate: new Date().toISOString().split("T")[0],
      });
      toast.success("Cập nhật đăng ký cho người dùng thành công");
    } catch (error) {
      console.error("Lỗi khi phân gói đăng ký:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Không thể phân gói đăng ký";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateSubscriptionStatus = async (userId, status) => {
    try {
      const subscriber = subscribers.find(
        (sub) => (sub._id || sub.id) === userId
      );
      if (!subscriber || !subscriber.subscription) {
        throw new Error("Người đăng ký hoặc gói không tồn tại.");
      }

      const subscriptionId =
        subscriber.subscription.subscriptionId?._id ||
        subscriber.subscription.subscriptionId;
      if (!subscriptionId) {
        throw new Error("ID gói đăng ký không hợp lệ.");
      }

      const response = await authAPI.updateSubscriptionStatus(userId, {
        subscriptionId,
        status,
      });

      setSubscribers(
        subscribers.map((sub) =>
          (sub._id || sub.id) === userId ? response.data.user : sub
        )
      );

      setUsers(
        users.map((user) =>
          (user._id || user.id) === userId ? response.data.user : user
        )
      );

      toast.success(
        `Cập nhật trạng thái đăng ký thành “${
          status === "active" ? "Đang hoạt động" : "Không hoạt động"
        }”`
      );
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đăng ký:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Không thể cập nhật trạng thái đăng ký";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      const response = await subscriptionOrderAPI.updateSubscriptionOrderStatus(
        orderId,
        { status }
      );
      setSubscriptionOrders(
        subscriptionOrders.map((order) =>
          (order._id || order.id) === orderId ? response.data.order : order
        )
      );
      toast.success(
        status === "active"
          ? "Kích hoạt đơn hàng thành công"
          : "Đã kích hoạt đơn hàng"
      );
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
      const errorMsg =
        error.response?.data?.message || "Không thể cập nhật trạng thái đơn";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Bạn có chắc muốn hủy đơn hàng đăng ký này?")) return;

    try {
      const response = await subscriptionOrderAPI.cancelSubscriptionOrder(
        orderId
      );
      setSubscriptionOrders(
        subscriptionOrders.map((order) =>
          (order._id || order.id) === orderId ? response.data.order : order
        )
      );
      toast.success("Hủy đơn hàng đăng ký thành công");
    } catch (error) {
      console.error("Lỗi khi hủy đơn:", error);
      const errorMsg = error.response?.data?.message || "Không thể hủy đơn";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleViewPlan = (plan) => {
    setCurrentPlan(plan);
    setPlanFormData({
      name: plan.name,
      price: plan.price.toString(),
      duration: plan.duration.toString(),
      description: plan.description || "",
    });
    setShowPlanModal(true);
  };

  const handleAddPlan = () => {
    setCurrentPlan(null);
    setPlanFormData({
      name: "",
      price: "",
      duration: "30",
      description: "",
    });
    setShowPlanModal(true);
  };

  const handleViewSubscriber = (subscriber) => {
    setCurrentSubscriber(subscriber);
    setUserSubscriptionFormData({
      userId: subscriber._id || subscriber.id,
      subscriptionId:
        subscriber.subscription?.subscriptionId?._id ||
        subscriber.subscription?.subscriptionId ||
        "",
      status: subscriber.subscription?.status || "active",
      startDate: subscriber.subscription?.startDate
        ? new Date(subscriber.subscription.startDate)
            .toISOString()
            .split("T")[0]
        : new Date().toISOString().split("T")[0],
    });
    setShowSubscriberModal(true);
  };

  const handleAddSubscriber = () => {
    setCurrentSubscriber(null);
    setUserSubscriptionFormData({
      userId: "",
      subscriptionId: "",
      status: "active",
      startDate: new Date().toISOString().split("T")[0],
    });
    setShowSubscriberModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredSubscribers = subscribers.filter((subscriber) => {
    const matchesRole = roleFilter ? subscriber.role === roleFilter : true;
    const matchesStatus = statusFilter
      ? subscriber.subscription?.status === statusFilter
      : true;
    const matchesSearch = searchQuery
      ? subscriber.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subscriber.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subscriber.username?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return matchesRole && matchesStatus && matchesSearch;
  });

  const filteredOrders = subscriptionOrders.filter((order) => {
    const matchesStatus = orderStatusFilter
      ? order.status === orderStatusFilter
      : true;
    const matchesSearch = orderSearchQuery
      ? order.userId?.name
          ?.toLowerCase()
          .includes(orderSearchQuery.toLowerCase()) ||
        order.userId?.email
          ?.toLowerCase()
          .includes(orderSearchQuery.toLowerCase()) ||
        order.subscriptionId?.name
          ?.toLowerCase()
          .includes(orderSearchQuery.toLowerCase())
      : true;
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "200px" }}
      >
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="fs-4 fw-bold mb-4">Gói đăng ký</h1>

      {error && (
        <Alert
          variant="danger"
          className="mb-4"
          onClose={() => setError(null)}
          dismissible
        >
          {error}
        </Alert>
      )}

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="plans" title="Gói đăng ký">
          <div className="d-flex justify-content-end mb-3">
            <Button onClick={handleAddPlan}>
              <i className="bi bi-plus-circle me-2"></i>
              Thêm gói mới
            </Button>
          </div>

          <div className="row">
            {subscriptionPlans.length > 0 ? (
              subscriptionPlans.map((plan) => (
                <div key={plan._id || plan.id} className="col-md-4 mb-4">
                  <Card className="h-100">
                    <Card.Header className="bg-white">
                      <h5 className="mb-0">{plan.name}</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <h3 className="mb-0">
                          {plan.price.toLocaleString("vi-VN")} VND
                          <span className="fs-6 text-muted">
                            /{plan.duration} tháng
                          </span>
                        </h3>
                      </div>
                      <p className="text-muted">
                        {plan.description || "Không có mô tả"}
                      </p>
                    </Card.Body>
                    <Card.Footer className="bg-white border-0 d-flex justify-content-between">
                      <Button
                        variant="outline"
                        onClick={() => handleViewPlan(plan)}
                      >
                        Chỉnh sửa
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDeletePlan(plan._id || plan.id)}
                      >
                        Xóa
                      </Button>
                    </Card.Footer>
                  </Card>
                </div>
              ))
            ) : (
              <div className="col-12">
                <div className="text-center py-5 bg-light rounded">
                  <p className="mb-0">Không tìm thấy gói đăng ký</p>
                </div>
              </div>
            )}
          </div>
        </Tab>
        <Tab eventKey="subscribers" title="Người đăng ký">
          <div className="mb-4">
            <div className="row g-3">
              <div className="col-md-4">
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Tìm theo tên hoặc email"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>
              </div>
              <div className="col-md-3">
                <Form.Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="">Tất cả vai trò</option>
                  <option value="subscriber">Người đăng ký</option>
                  <option value="user">Chưa đăng ký</option>
                  <option value="admin">Quản trị viên</option>
                </Form.Select>
              </div>
              <div className="col-md-3">
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </Form.Select>
              </div>
              <div className="col-md-2">
                <Button className="w-100" onClick={handleAddSubscriber}>
                  <i className="bi bi-plus-circle me-2"></i>
                  Phân gói
                </Button>
              </div>
            </div>
          </div>

          <Card>
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Gói</th>
                    <th>Ngày bắt đầu</th>
                    <th>Ngày kết thúc</th>
                    <th>Trạng thái</th>
                    <th className="text-end">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscribers.length > 0 ? (
                    filteredSubscribers.map((subscriber) => (
                      <tr key={subscriber._id || subscriber.id}>
                        <td>{subscriber.name || subscriber.username}</td>
                        <td>{subscriber.email}</td>
                        <td>{subscriber.role}</td>
                        <td>
                          {subscriber.subscription?.subscriptionId
                            ? typeof subscriber.subscription.subscriptionId ===
                              "object"
                              ? subscriber.subscription.subscriptionId.name
                              : subscriptionPlans.find(
                                  (p) =>
                                    (p._id || p.id) ===
                                    subscriber.subscription.subscriptionId
                                )?.name || "Không rõ"
                            : "N/A"}
                        </td>
                        <td>
                          {formatDate(subscriber.subscription?.startDate)}
                        </td>
                        <td>{formatDate(subscriber.subscription?.endDate)}</td>
                        <td>
                          <Badge
                            bg={
                              subscriber.subscription?.status === "active"
                                ? "success"
                                : "secondary"
                            }
                          >
                            {subscriber.subscription?.status === "active"
                              ? "Đang hoạt động"
                              : "Không hoạt động"}
                          </Badge>
                        </td>
                        <td className="text-end">
                          <Button
                            variant="link"
                            className="text-success p-0 me-2"
                            onClick={() => handleViewSubscriber(subscriber)}
                          >
                            Chỉnh sửa
                          </Button>
                          {subscriber.subscription?.status === "active" ? (
                            <Button
                              variant="link"
                              className="text-danger p-0"
                              onClick={() =>
                                handleUpdateSubscriptionStatus(
                                  subscriber._id || subscriber.id,
                                  "inactive"
                                )
                              }
                            >
                              Hủy kích hoạt
                            </Button>
                          ) : (
                            <Button
                              variant="link"
                              className="text-success p-0"
                              onClick={() =>
                                handleUpdateSubscriptionStatus(
                                  subscriber._id || subscriber.id,
                                  "active"
                                )
                              }
                            >
                              Kích hoạt
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-4">
                        Không tìm thấy người đăng ký
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </Tab>
        <Tab eventKey="orders" title="Đơn hàng đăng ký">
          <div className="mb-4">
            <div className="row g-3">
              <div className="col-md-6">
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Tìm theo người dùng hoặc gói"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                  />
                </InputGroup>
              </div>
              <div className="col-md-4">
                <Form.Select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="unverified">Chưa xác nhận</option>
                  <option value="pending">Đang chờ</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="cancelled">Đã hủy</option>
                </Form.Select>
              </div>
            </div>
          </div>

          <Card>
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Người dùng</th>
                    <th>Gói đăng ký</th>
                    <th>Giá</th>
                    <th>Phương thức</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th className="text-end">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr key={order._id || order.id}>
                        <td>
                          <code className="text-muted">
                            {(order._id || order.id).slice(-8)}
                          </code>
                        </td>
                        <td>
                          <div>
                            <div className="fw-medium">
                              {order.userId?.name ||
                                order.userId?.username ||
                                "Không rõ"}
                            </div>
                            <small className="text-muted">
                              {order.userId?.email}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="fw-medium">
                              {order.subscriptionId?.name || "Không rõ"}
                            </div>
                            <small className="text-muted">
                              {order.subscriptionId?.duration} tháng
                            </small>
                          </div>
                        </td>
                        <td>
                          <span className="fw-medium">
                            {order.price?.toLocaleString("vi-VN")} VND
                          </span>
                        </td>
                        <td>
                          <Badge
                            bg={
                              order.paymentMethod === "Online Banking"
                                ? "info"
                                : "warning"
                            }
                            className="text-dark"
                          >
                            {order.paymentMethod === "Online Banking"
                              ? "Ngân hàng trực tuyến"
                              : "Khác"}
                          </Badge>
                        </td>
                        <td>
                          <Badge
                            bg={
                              order.status === "active"
                                ? "success"
                                : order.status === "pending"
                                ? "warning"
                                : order.status === "unverified"
                                ? "secondary"
                                : "danger"
                            }
                          >
                            {order.status === "active"
                              ? "Đang hoạt động"
                              : order.status === "pending"
                              ? "Đang chờ"
                              : order.status === "unverified"
                              ? "Chưa xác nhận"
                              : "Đã hủy"}
                          </Badge>
                        </td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            {order.status === "unverified" && (
                              <>
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateOrderStatus(
                                      order._id || order.id,
                                      "pending"
                                    )
                                  }
                                >
                                  Phê duyệt
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() =>
                                    handleCancelOrder(order._id || order.id)
                                  }
                                >
                                  Hủy
                                </Button>
                              </>
                            )}
                            {order.status === "pending" && (
                              <>
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateOrderStatus(
                                      order._id || order.id,
                                      "active"
                                    )
                                  }
                                >
                                  Kích hoạt
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() =>
                                    handleCancelOrder(order._id || order.id)
                                  }
                                >
                                  Hủy
                                </Button>
                              </>
                            )}
                            {order.status === "active" && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() =>
                                  handleCancelOrder(order._id || order.id)
                                }
                              >
                                Hủy
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-4">
                        Không tìm thấy đơn hàng đăng ký
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </Tab>
      </Tabs>

      {/* Modal Thêm / Chỉnh sửa Gói đăng ký */}
      <Modal show={showPlanModal} onHide={() => setShowPlanModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {currentPlan ? "Chỉnh sửa gói" : "Thêm gói mới"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={currentPlan ? handleUpdatePlan : handleCreatePlan}>
            <Form.Group className="mb-3">
              <Form.Label>Tên gói</Form.Label>
              <Form.Control
                type="text"
                name="name"
                placeholder="Nhập tên gói"
                value={planFormData.name}
                onChange={handlePlanInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Giá (VND)</Form.Label>
              <InputGroup>
                <InputGroup.Text>₫</InputGroup.Text>
                <Form.Control
                  type="number"
                  name="price"
                  placeholder="0"
                  value={planFormData.price}
                  onChange={handlePlanInputChange}
                  min="0"
                  required
                />
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Thời gian (tháng)</Form.Label>
              <Form.Control
                type="number"
                name="duration"
                placeholder="1"
                value={planFormData.duration}
                onChange={handlePlanInputChange}
                min="1"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                rows={3}
                value={planFormData.description}
                onChange={handlePlanInputChange}
              />
            </Form.Group>
            <div className="d-grid gap-2">
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting ? (
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                ) : currentPlan ? (
                  "Cập nhật gói"
                ) : (
                  "Tạo gói"
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal Thêm / Chỉnh sửa Người đăng ký */}
      <Modal
        show={showSubscriberModal}
        onHide={() => setShowSubscriberModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {currentSubscriber ? "Chỉnh sửa đăng ký" : "Phân gói đăng ký"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAssignSubscription}>
            <Form.Group className="mb-3">
              <Form.Label>Người dùng</Form.Label>
              <Form.Select
                name="userId"
                value={userSubscriptionFormData.userId}
                onChange={handleUserSubscriptionInputChange}
                required
                disabled={!!currentSubscriber}
              >
                <option value="">Chọn Người dùng</option>
                {users.map((user) => (
                  <option key={user._id || user.id} value={user._id || user.id}>
                    {user.name || user.username} ({user.email})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Gói đăng ký</Form.Label>
              <Form.Select
                name="subscriptionId"
                value={userSubscriptionFormData.subscriptionId}
                onChange={handleUserSubscriptionInputChange}
                required
              >
                <option value="">Chọn gói</option>
                {subscriptionPlans.map((plan) => (
                  <option key={plan._id || plan.id} value={plan._id || plan.id}>
                    {plan.name} ({plan.price.toLocaleString("vi-VN")} VND/
                    {plan.duration} tháng)
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Trạng thái</Form.Label>
              <Form.Select
                name="status"
                value={userSubscriptionFormData.status}
                onChange={handleUserSubscriptionInputChange}
              >
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Ngày bắt đầu</Form.Label>
              <Form.Control
                type="date"
                name="startDate"
                value={userSubscriptionFormData.startDate}
                onChange={handleUserSubscriptionInputChange}
              />
            </Form.Group>

            <div className="d-grid gap-2">
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting ? (
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                ) : currentSubscriber ? (
                  "Cập nhật đăng ký"
                ) : (
                  "Phân gói đăng ký"
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default SubscriptionsPage;
