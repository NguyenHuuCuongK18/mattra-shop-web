"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Badge,
  Form,
  InputGroup,
  Alert,
  Row,
  Col,
} from "react-bootstrap";
import { authAPI } from "../../utils/api";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    role: "user",
    address: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await authAPI.getAllUsers();
        setUsers(response.data.users || []);
      } catch (error) {
        console.error("Lỗi khi tải người dùng:", error);
        setError("Không thể tải người dùng. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Họ và tên bắt buộc";
    if (!formData.username.trim()) errors.username = "Tên đăng nhập bắt buộc";
    if (!formData.email.trim()) errors.email = "Email bắt buộc";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      errors.email = "Email không hợp lệ";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = () => {
    setCurrentUser(null);
    setFormData({
      name: "",
      email: "",
      username: "",
      role: "user",
      address: "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setCurrentUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      address: user.address || "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleViewUser = (user) => {
    setCurrentUser(user);
    setIsViewModalOpen(true);
  };

  const handleDeleteUser = (user) => {
    setCurrentUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setFormSubmitting(true);
    try {
      let response;
      const userId = currentUser ? currentUser._id || currentUser.id : null;
      if (currentUser) {
        response = await authAPI.updateProfile(formData);
      } else {
        response = await authAPI.register(formData);
      }

      if (currentUser) {
        setUsers(
          users.map((u) =>
            (u._id || u.id) === userId ? response.data.user : u
          )
        );
      } else {
        setUsers([...users, response.data.user]);
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Lỗi khi lưu người dùng:", error);
      setError(error.response?.data?.message || "Không thể lưu người dùng");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentUser) return;

    setFormSubmitting(true);
    try {
      const userId = currentUser._id || currentUser.id;
      await authAPI.deleteUser(userId);

      setUsers(users.filter((u) => (u._id || u.id) !== userId));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Lỗi khi xóa người dùng:", error);
      setError(error.response?.data?.message || "Không thể xóa người dùng");
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesRole = roleFilter ? user.role === roleFilter : true;
    const matchesSearch = searchQuery
      ? user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesRole && matchesSearch;
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fs-4 fw-bold mb-0">Người dùng</h1>
        <Button onClick={handleAddUser}>Thêm người dùng</Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="mb-4">
        <div className="row g-3">
          <div className="col-md-8">
            <InputGroup>
              <InputGroup.Text>
                <i className="bi bi-search"></i>
              </InputGroup.Text>
              <Form.Control
                placeholder="Tìm theo tên, email hoặc tên đăng nhập"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
          </div>
          <div className="col-md-4">
            <Form.Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Tất cả vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="user">Người dùng</option>
            </Form.Select>
          </div>
        </div>
      </div>

      <Card>
        <div className="table-responsive">
          <Table hover className="mb-0">
            <thead>
              <tr>
                <th>Họ và tên</th>
                <th>Tên đăng nhập</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th className="text-end">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id || user.id}>
                    <td>{user.name}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <Badge bg={user.role === "admin" ? "danger" : "success"}>
                        {user.role === "admin" ? "Quản trị viên" : "Người dùng"}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <Button
                        variant="link"
                        className="text-success p-0 me-3"
                        onClick={() => handleEditUser(user)}
                      >
                        Chỉnh sửa
                      </Button>
                      <Button
                        variant="link"
                        className="text-danger p-0"
                        onClick={() => handleDeleteUser(user)}
                      >
                        Xóa
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    Không tìm thấy người dùng
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Modal Thêm / Chỉnh sửa Người dùng */}
      {isModalOpen && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {currentUser ? "Chỉnh sửa người dùng" : "Thêm người dùng"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formSubmitting}
                ></button>
              </div>
              <div className="modal-body">
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Họ và tên</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      isInvalid={!!formErrors.name}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {formErrors.name}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Tên đăng nhập</Form.Label>
                    <Form.Control
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      isInvalid={!!formErrors.username}
                      required
                      disabled={currentUser}
                    />
                    <Form.Control.Feedback type="invalid">
                      {formErrors.username}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      isInvalid={!!formErrors.email}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {formErrors.email}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Vai trò</Form.Label>
                    <Form.Select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                    >
                      <option value="user">Người dùng</option>
                      <option value="admin">Quản trị viên</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Địa chỉ</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </Form.Group>

                  {!currentUser && (
                    <Form.Group className="mb-3">
                      <Form.Label>Mật khẩu</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        placeholder="Để trống để hệ thống tạo ngẫu nhiên"
                        onChange={handleInputChange}
                      />
                      <Form.Text className="text-muted">
                        Nếu để trống, mật khẩu ngẫu nhiên sẽ được tạo và gửi qua
                        email.
                      </Form.Text>
                    </Form.Group>
                  )}
                </Form>
              </div>
              <div className="modal-footer">
                <Button
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formSubmitting}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleSubmit}
                  loading={formSubmitting}
                  disabled={formSubmitting}
                >
                  {currentUser ? "Cập nhật" : "Tạo"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem thông tin Người dùng */}
      {isViewModalOpen && currentUser && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Hồ sơ người dùng: {currentUser.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsViewModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-4">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt="Ảnh đại diện"
                      className="rounded-circle mb-3"
                      style={{
                        width: "120px",
                        height: "120px",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center mb-3"
                      style={{ width: "120px", height: "120px" }}
                    >
                      {currentUser.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                <Row>
                  <Col md={6} className="mb-3">
                    <p className="text-secondary mb-1">Họ và tên</p>
                    <p className="fw-semibold mb-0">{currentUser.name}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-secondary mb-1">Tên đăng nhập</p>
                    <p className="fw-semibold mb-0">{currentUser.username}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-secondary mb-1">Email</p>
                    <p className="fw-semibold mb-0">{currentUser.email}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-secondary mb-1">Vai trò</p>
                    <Badge
                      bg={currentUser.role === "admin" ? "danger" : "success"}
                    >
                      {currentUser.role === "admin"
                        ? "Quản trị viên"
                        : "Người dùng"}
                    </Badge>
                  </Col>
                  <Col md={12} className="mb-3">
                    <p className="text-secondary mb-1">Địa chỉ</p>
                    <p className="fw-semibold mb-0">
                      {currentUser.address || "Chưa cung cấp"}
                    </p>
                  </Col>
                </Row>
                {currentUser.subscription && (
                  <>
                    <hr />
                    <h5 className="fw-semibold mb-3">Thông tin đăng ký</h5>
                    <Row>
                      <Col md={6} className="mb-3">
                        <p className="text-secondary mb-1">Trạng thái</p>
                        <p className="fw-semibold mb-0">
                          {currentUser.subscription.status === "active"
                            ? "Đang hoạt động"
                            : "Không hoạt động"}
                        </p>
                      </Col>
                      <Col md={6} className="mb-3">
                        <p className="text-secondary mb-1">Mã gói</p>
                        <p className="fw-semibold mb-0">
                          {currentUser.subscription.subscriptionId}
                        </p>
                      </Col>
                      <Col md={6} className="mb-3">
                        <p className="text-secondary mb-1">Gói</p>
                        <p className="fw-semibold mb-0">
                          {currentUser.subscription.plan || "Tiêu chuẩn"}
                        </p>
                      </Col>
                      <Col md={6} className="mb-3">
                        <p className="text-secondary mb-1">Chu kỳ thanh toán</p>
                        <p className="fw-semibold mb-0">
                          {currentUser.subscription.billingCycle ||
                            "Hàng tháng"}
                        </p>
                      </Col>
                      {currentUser.subscription.status === "active" && (
                        <>
                          <Col md={6} className="mb-3">
                            <p className="text-secondary mb-1">Ngày bắt đầu</p>
                            <p className="fw-semibold mb-0">
                              {new Date(
                                currentUser.subscription.startDate
                              ).toLocaleDateString("vi-VN")}
                            </p>
                          </Col>
                          <Col md={6} className="mb-3">
                            <p className="text-secondary mb-1">Ngày kết thúc</p>
                            <p className="fw-semibold mb-0">
                              {new Date(
                                currentUser.subscription.endDate
                              ).toLocaleDateString("vi-VN")}
                            </p>
                          </Col>
                        </>
                      )}
                    </Row>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <Button
                  variant="secondary"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xóa Người dùng */}
      {isDeleteModalOpen && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Xóa người dùng</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={formSubmitting}
                ></button>
              </div>
              <div className="modal-body">
                <p>Bạn có chắc muốn xóa người dùng "{currentUser?.name}"?</p>
                <p className="text-danger mb-0">
                  Hành động không thể hoàn tác.
                </p>
              </div>
              <div className="modal-footer">
                <Button
                  variant="secondary"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={formSubmitting}
                >
                  Hủy
                </Button>
                <Button
                  variant="danger"
                  onClick={handleConfirmDelete}
                  loading={formSubmitting}
                  disabled={formSubmitting}
                >
                  Xóa
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersPage;
