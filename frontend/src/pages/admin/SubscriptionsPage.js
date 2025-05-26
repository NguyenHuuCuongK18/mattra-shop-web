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
        console.error("Error fetching data:", error);
        setError("Failed to load data. Please try again later.");
        toast.error("Failed to load data");
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
      toast.success("Subscription plan created successfully");
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to create subscription plan";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    if (!currentPlan) return;

    setFormSubmitting(true);

    try {
      const payload = {
        ...planFormData,
        price: Number.parseFloat(planFormData.price),
        duration: Number.parseInt(planFormData.duration),
      };

      const response = await subscriptionAPI.updateSubscription(
        currentPlan.id,
        payload
      );

      setSubscriptionPlans(
        subscriptionPlans.map((plan) =>
          plan.id === currentPlan.id ? response.data.subscription : plan
        )
      );
      setShowPlanModal(false);
      toast.success("Subscription plan updated successfully");
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to update subscription plan";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (
      !window.confirm("Are you sure you want to delete this subscription plan?")
    )
      return;

    try {
      await subscriptionAPI.deleteSubscription(planId);
      setSubscriptionPlans(
        subscriptionPlans.filter((plan) => plan.id !== planId)
      );
      toast.success("Subscription plan deleted successfully");
    } catch (error) {
      console.error("Error deleting subscription plan:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to delete subscription plan";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleAssignSubscription = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);

    try {
      const userId = userSubscriptionFormData.userId;
      const response = await authAPI.updateSubscriptionStatus(userId, {
        subscriptionId: userSubscriptionFormData.subscriptionId,
        status: userSubscriptionFormData.status,
        startDate: new Date(userSubscriptionFormData.startDate).toISOString(),
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
      toast.success("User subscription updated successfully");
    } catch (error) {
      console.error("Error assigning subscription:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to assign subscription";
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
      if (!subscriber || !subscriber.subscription) return;

      const response = await authAPI.updateSubscriptionStatus(userId, {
        subscriptionId: subscriber.subscription.subscriptionId,
        status: status,
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

      toast.success(`Subscription status updated to ${status}`);
    } catch (error) {
      console.error("Error updating subscription status:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to update subscription status";
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
      toast.success(`Order status updated to ${status}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to update order status";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this subscription order?"
      )
    )
      return;

    try {
      const response = await subscriptionOrderAPI.cancelSubscriptionOrder(
        orderId
      );
      setSubscriptionOrders(
        subscriptionOrders.map((order) =>
          (order._id || order.id) === orderId ? response.data.order : order
        )
      );
      toast.success("Subscription order cancelled successfully");
    } catch (error) {
      console.error("Error cancelling order:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to cancel order";
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
    return date.toLocaleDateString("en-US", {
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
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="fs-4 fw-bold mb-4">Subscriptions</h1>

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
        <Tab eventKey="plans" title="Subscription Plans">
          <div className="d-flex justify-content-end mb-3">
            <Button onClick={handleAddPlan}>
              <i className="bi bi-plus-circle me-2"></i>
              Add New Plan
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
                          ${plan.price.toFixed(2)}
                          <span className="fs-6 text-muted">
                            /{plan.duration} days
                          </span>
                        </h3>
                      </div>
                      <p className="text-muted">
                        {plan.description || "No description available"}
                      </p>
                    </Card.Body>
                    <Card.Footer className="bg-white border-0 d-flex justify-content-between">
                      <Button
                        variant="outline"
                        onClick={() => handleViewPlan(plan)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        Delete
                      </Button>
                    </Card.Footer>
                  </Card>
                </div>
              ))
            ) : (
              <div className="col-12">
                <div className="text-center py-5 bg-light rounded">
                  <p className="mb-0">No subscription plans found</p>
                </div>
              </div>
            )}
          </div>
        </Tab>
        <Tab eventKey="subscribers" title="Subscribers">
          <div className="mb-4">
            <div className="row g-3">
              <div className="col-md-4">
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search by name or email"
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
                  <option value="">All Roles</option>
                  <option value="subscriber">Subscribers</option>
                  <option value="user">Non-Subscribers</option>
                  <option value="admin">Admins</option>
                </Form.Select>
              </div>
              <div className="col-md-3">
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </div>
              <div className="col-md-2">
                <Button className="w-100" onClick={handleAddSubscriber}>
                  <i className="bi bi-plus-circle me-2"></i>
                  Assign
                </Button>
              </div>
            </div>
          </div>

          <Card>
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Subscription</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
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
                                )?.name || "Unknown"
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
                            {subscriber.subscription?.status || "N/A"}
                          </Badge>
                        </td>
                        <td className="text-end">
                          <Button
                            variant="link"
                            className="text-success p-0 me-2"
                            onClick={() => handleViewSubscriber(subscriber)}
                          >
                            Edit
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
                              Deactivate
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
                              Activate
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-4">
                        No subscribers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </Tab>
        <Tab eventKey="orders" title="Subscription Orders">
          <div className="mb-4">
            <div className="row g-3">
              <div className="col-md-6">
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search by user or subscription"
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
                  <option value="">All Statuses</option>
                  <option value="unverified">Unverified</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </div>
            </div>
          </div>

          <Card>
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>User</th>
                    <th>Subscription</th>
                    <th>Price</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="text-end">Actions</th>
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
                                "Unknown User"}
                            </div>
                            <small className="text-muted">
                              {order.userId?.email}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="fw-medium">
                              {order.subscriptionId?.name || "Unknown Plan"}
                            </div>
                            <small className="text-muted">
                              {order.subscriptionId?.duration} days
                            </small>
                          </div>
                        </td>
                        <td>
                          <span className="fw-medium">
                            ${order.price?.toFixed(2)}
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
                            {order.paymentMethod}
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
                            {order.status}
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
                                  Approve
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() =>
                                    handleCancelOrder(order._id || order.id)
                                  }
                                >
                                  Cancel
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
                                  Activate
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() =>
                                    handleCancelOrder(order._id || order.id)
                                  }
                                >
                                  Cancel
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
                                Cancel
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-4">
                        No subscription orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </Tab>
      </Tabs>

      {/* Subscription Plan Modal */}
      <Modal show={showPlanModal} onHide={() => setShowPlanModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {currentPlan ? "Edit Plan" : "Add New Plan"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={currentPlan ? handleUpdatePlan : handleCreatePlan}>
            <Form.Group className="mb-3">
              <Form.Label>Plan Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                placeholder="Enter plan name"
                value={planFormData.name}
                onChange={handlePlanInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Price</Form.Label>
              <InputGroup>
                <InputGroup.Text>$</InputGroup.Text>
                <Form.Control
                  type="number"
                  name="price"
                  placeholder="0.00"
                  value={planFormData.price}
                  onChange={handlePlanInputChange}
                  min="0"
                  step="0.01"
                  required
                />
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Duration (days)</Form.Label>
              <Form.Control
                type="number"
                name="duration"
                placeholder="30"
                value={planFormData.duration}
                onChange={handlePlanInputChange}
                min="1"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                rows={3}
                value={planFormData.description}
                onChange={handlePlanInputChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPlanModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={currentPlan ? handleUpdatePlan : handleCreatePlan}
            disabled={formSubmitting}
          >
            {formSubmitting ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Processing...
              </>
            ) : currentPlan ? (
              "Update Plan"
            ) : (
              "Create Plan"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add/Edit Subscriber Modal */}
      <Modal
        show={showSubscriberModal}
        onHide={() => setShowSubscriberModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {currentSubscriber ? "Edit Subscription" : "Assign Subscription"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAssignSubscription}>
            <Form.Group className="mb-3">
              <Form.Label>User</Form.Label>
              <Form.Select
                name="userId"
                value={userSubscriptionFormData.userId}
                onChange={handleUserSubscriptionInputChange}
                required
                disabled={!!currentSubscriber}
              >
                <option value="">Select User</option>
                {users.map((user) => (
                  <option key={user._id || user.id} value={user._id || user.id}>
                    {user.name || user.username} ({user.email})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Subscription Plan</Form.Label>
              <Form.Select
                name="subscriptionId"
                value={userSubscriptionFormData.subscriptionId}
                onChange={handleUserSubscriptionInputChange}
                required
              >
                <option value="">Select Plan</option>
                {subscriptionPlans.map((plan) => (
                  <option key={plan._id || plan.id} value={plan._id || plan.id}>
                    {plan.name} (${plan.price}/{plan.duration} days)
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={userSubscriptionFormData.status}
                onChange={handleUserSubscriptionInputChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Start Date</Form.Label>
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
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Processing...
                  </>
                ) : currentSubscriber ? (
                  "Update Subscription"
                ) : (
                  "Assign Subscription"
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
