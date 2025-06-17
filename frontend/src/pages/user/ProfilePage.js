"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/ui/Button";
import {
  Container,
  Row,
  Col,
  Alert,
  Tabs,
  Tab,
  Form,
  ListGroup,
  Spinner,
} from "react-bootstrap";
import { voucherAPI } from "../../utils/api";
import { toast } from "react-hot-toast";

/**
 * Displays and manages the user's profile page, including personal information, password changes, subscription details, vouchers, and account settings.
 *
 * Provides forms for updating profile data (name, phone, address, avatar), changing the password, and managing subscription and vouchers. Handles validation, loading states, and error or success feedback for each operation. Also includes toggles for email and marketing notifications, and an option to delete the account.
 *
 * @remark
 * Phone number updates are validated to require 10–11 digits. Avatar uploads are limited to image files under 5MB. Profile and avatar updates are processed independently, and error messages are shown for each specific failure.
 */
function ProfilePage() {
  const { user, updateProfile, changePassword, uploadAvatar } = useAuth();

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarSuccess, setAvatarSuccess] = useState("");

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const [vouchers, setVouchers] = useState([]);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState("");

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value,
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setAvatarError("Vui lòng chọn file ảnh");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setAvatarError("Kích thước file phải nhỏ hơn 5MB");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setAvatarError("");
      setAvatarSuccess("");
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError("");
    setProfileSuccess("");
    setAvatarError("");
    setAvatarSuccess("");

    // Validate phone number if provided
    if (profileData.phone && !/^\d{10,11}$/.test(profileData.phone)) {
      setProfileError("Số điện thoại không hợp lệ (10-11 chữ số)");
      setProfileLoading(false);
      return;
    }

    try {
      // Update profile information (name, phone, address)
      await updateProfile(profileData);
      setProfileSuccess("Cập nhật thông tin thành công!");

      // Only update avatar if a new file is selected
      if (avatarFile) {
        setAvatarLoading(true);
        await uploadAvatar(avatarFile);
        setAvatarSuccess("Đã cập nhật ảnh đại diện!");
        setAvatarFile(null);
      }
    } catch (error) {
      console.error("Lỗi cập nhật hồ sơ:", error);
      const errorMessage =
        error.response?.data?.message || "Không thể cập nhật hồ sơ";
      if (error.message.includes("avatar")) {
        setAvatarError(errorMessage);
      } else {
        setProfileError(errorMessage);
      }
    } finally {
      setProfileLoading(false);
      setAvatarLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Mật khẩu mới không khớp");
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("Mật khẩu phải có ít nhất 6 ký tự");
      setPasswordLoading(false);
      return;
    }

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordSuccess(
        "Đã thay đổi mật khẩu thành công! Bạn sẽ được đăng xuất."
      );
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Lỗi thay đổi mật khẩu:", error);
      setPasswordError(
        error.response?.data?.message || "Không thể thay đổi mật khẩu"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    setAvatarPreview(user?.avatar || "");
    setProfileData({
      name: user?.name || "",
      phone: user?.phone || "",
      address: user?.address || "",
    });
  }, [user]);

  useEffect(() => {
    const fetchVouchers = async () => {
      setVoucherLoading(true);
      setVoucherError("");
      try {
        const response = await voucherAPI.getUserVouchers();
        setVouchers(response.data.vouchers);
      } catch (err) {
        setVoucherError(err.response?.data?.message || "Không thể tải voucher");
      } finally {
        setVoucherLoading(false);
      }
    };
    if (user) fetchVouchers();
  }, [user]);

  return (
    <Container className="py-5 fade-in">
      {/* Header profile */}
      <div className="profile-header bg-light rounded-4 p-4 mb-4 shadow-sm">
        <div className="d-flex flex-column flex-md-row align-items-center gap-4">
          <div className="profile-avatar-container">
            {avatarPreview ? (
              <img
                src={avatarPreview || "/placeholder.svg"}
                alt="Ảnh đại diện"
                className="profile-avatar rounded-circle border border-3 border-white shadow"
              />
            ) : (
              <div className="profile-avatar rounded-circle border border-3 border-white shadow bg-success text-white d-flex align-items-center justify-content-center">
                <span className="display-4">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
            )}
          </div>
          <div className="text-center text-md-start">
            <h1 className="display-6 fw-bold mb-1">{user?.name || "User"}</h1>
            <p className="text-secondary mb-2">{user?.email || ""}</p>
            <div className="d-flex flex-wrap gap-2 justify-content-center justify-content-md-start">
              <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill">
                <i className="bi bi-person-check me-1"></i>
                {user?.role || "User"}
              </span>
              {user?.subscription?.status === "active" && (
                <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill">
                  <i className="bi bi-star me-1"></i>
                  Thành viên Premium
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-4 shadow-sm overflow-hidden mb-4">
        <Tabs defaultActiveKey="profile" className="profile-tabs">
          {/* Tab 1: Thông tin cá nhân */}
          <Tab
            eventKey="profile"
            title={
              <>
                <i className="bi bi-person me-2"></i>Thông tin cá nhân
              </>
            }
          >
            <div className="p-4">
              <form onSubmit={handleProfileSubmit}>
                {profileError && <Alert variant="danger">{profileError}</Alert>}
                {profileSuccess && (
                  <Alert variant="success">{profileSuccess}</Alert>
                )}
                {avatarSuccess && (
                  <Alert variant="success">{avatarSuccess}</Alert>
                )}

                <Row>
                  {/* Thay đổi avatar */}
                  <Col lg={4} className="mb-4">
                    <div className="text-center">
                      <div className="mb-3 avatar-upload-container mx-auto">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview || "/placeholder.svg"}
                            alt="Xem trước avatar"
                            className="avatar-preview rounded-circle border border-3 border-white shadow"
                          />
                        ) : (
                          <div className="avatar-preview bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center border border-3 border-white shadow">
                            <span className="display-4">
                              {user?.name?.charAt(0).toUpperCase() || "U"}
                            </span>
                          </div>
                        )}
                        <div className="avatar-upload-overlay">
                          <label
                            htmlFor="avatar-upload"
                            className="avatar-upload-button"
                          >
                            <i className="bi bi-camera fs-4"></i>
                          </label>
                        </div>
                      </div>
                      <Form.Group controlId="avatar-upload">
                        <Form.Label className="fw-bold">
                          Ảnh đại diện
                        </Form.Label>
                        <Form.Control
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="form-control-modern"
                        />
                        <Form.Text className="text-muted">
                          Tải lên ảnh (max 5MB, định dạng JPG/PNG)
                        </Form.Text>
                        {avatarError && (
                          <p className="text-danger mt-2 small">
                            {avatarError}
                          </p>
                        )}
                      </Form.Group>
                    </div>
                  </Col>

                  {/* Thay đổi thông tin cá nhân */}
                  <Col lg={8}>
                    <Row>
                      <Col md={6} className="mb-3">
                        <div className="form-group-modern">
                          <label className="form-label fw-bold">
                            Tên đăng nhập
                          </label>
                          <div className="input-group-modern">
                            <span className="input-group-text-modern">
                              <i className="bi bi-person"></i>
                            </span>
                            <input
                              type="text"
                              value={user?.username || ""}
                              className="form-control-modern bg-light"
                              disabled
                            />
                          </div>
                          <div className="form-text">
                            Tên đăng nhập không thể thay đổi
                          </div>
                        </div>
                      </Col>
                      <Col md={6} className="mb-3">
                        <div className="form-group-modern">
                          <label className="form-label fw-bold">Email</label>
                          <div className="input-group-modern">
                            <span className="input-group-text-modern">
                              <i className="bi bi-envelope"></i>
                            </span>
                            <input
                              type="email"
                              value={user?.email || ""}
                              className="form-control-modern bg-light"
                              disabled
                            />
                          </div>
                          <div className="form-text">
                            Email không thể thay đổi
                          </div>
                        </div>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6} className="mb-3">
                        <div className="form-group-modern">
                          <label className="form-label fw-bold">
                            Họ và tên
                          </label>
                          <div className="input-group-modern">
                            <span className="input-group-text-modern">
                              <i className="bi bi-person-badge"></i>
                            </span>
                            <input
                              type="text"
                              className="form-control-modern"
                              id="name"
                              name="name"
                              value={profileData.name}
                              onChange={handleProfileChange}
                              required
                            />
                          </div>
                        </div>
                      </Col>
                      <Col md={6} className="mb-3">
                        <div className="form-group-modern">
                          <label className="form-label fw-bold">
                            Số điện thoại
                          </label>
                          <div className="input-group-modern">
                            <span className="input-group-text-modern">
                              <i className="bi bi-telephone"></i>
                            </span>
                            <input
                              type="text"
                              className="form-control-modern"
                              id="phone"
                              name="phone"
                              value={profileData.phone}
                              onChange={handleProfileChange}
                            />
                          </div>
                        </div>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12} className="mb-3">
                        <div className="form-group-modern">
                          <label className="form-label fw-bold">Địa chỉ</label>
                          <div className="input-group-modern">
                            <span className="input-group-text-modern">
                              <i className="bi bi-geo-alt"></i>
                            </span>
                            <input
                              type="text"
                              className="form-control-modern"
                              id="address"
                              name="address"
                              value={profileData.address}
                              onChange={handleProfileChange}
                            />
                          </div>
                        </div>
                      </Col>
                    </Row>

                    <div className="d-flex justify-content-end mt-4">
                      <Button
                        type="submit"
                        loading={profileLoading || avatarLoading}
                        disabled={profileLoading || avatarLoading}
                        className="btn-modern"
                      >
                        <i className="bi bi-check-circle me-2"></i>
                        Cập nhật hồ sơ
                      </Button>
                    </div>
                  </Col>
                </Row>
              </form>
            </div>
          </Tab>

          {/* Tab 2: Thay đổi mật khẩu */}
          <Tab
            eventKey="password"
            title={
              <>
                <i className="bi bi-shield-lock me-2"></i>Thay đổi mật khẩu
              </>
            }
          >
            <div className="p-4">
              <form onSubmit={handlePasswordSubmit}>
                {passwordError && (
                  <Alert variant="danger">{passwordError}</Alert>
                )}
                {passwordSuccess && (
                  <Alert variant="success">{passwordSuccess}</Alert>
                )}

                <Row className="justify-content-center">
                  <Col lg={8}>
                    <div className="password-change-container bg-light p-4 rounded-4 mb-4">
                      <h4 className="mb-3 fw-bold">
                        <i className="bi bi-shield-lock me-2"></i>
                        Bảo mật mật khẩu
                      </h4>
                      <p className="text-secondary mb-4">
                        Đảm bảo mật khẩu an toàn, ít nhất 6 ký tự bao gồm chữ,
                        số và ký tự đặc biệt.
                      </p>

                      <div className="form-group-modern mb-4">
                        <label className="form-label fw-bold">
                          Mật khẩu hiện tại
                        </label>
                        <div className="input-group-modern">
                          <span className="input-group-text-modern">
                            <i className="bi bi-key"></i>
                          </span>
                          <input
                            type="password"
                            className="form-control-modern"
                            id="currentPassword"
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            required
                          />
                        </div>
                      </div>

                      <Row>
                        <Col md={6} className="mb-3">
                          <div className="form-group-modern">
                            <label className="form-label fw-bold">
                              Mật khẩu mới
                            </label>
                            <div className="input-group-modern">
                              <span className="input-group-text-modern">
                                <i className="bi bi-lock"></i>
                              </span>
                              <input
                                type="password"
                                className="form-control-modern"
                                id="newPassword"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                required
                              />
                            </div>
                          </div>
                        </Col>
                        <Col md={6} className="mb-3">
                          <div className="form-group-modern">
                            <label className="form-label fw-bold">
                              Xác nhận mật khẩu mới
                            </label>
                            <div className="input-group-modern">
                              <span className="input-group-text-modern">
                                <i className="bi bi-lock-fill"></i>
                              </span>
                              <input
                                type="password"
                                className="form-control-modern"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                required
                              />
                            </div>
                          </div>
                        </Col>
                      </Row>

                      <div className="d-flex justify-content-end mt-4">
                        <Button
                          type="submit"
                          loading={passwordLoading}
                          disabled={passwordLoading}
                          className="btn-modern"
                        >
                          <i className="bi bi-shield-check me-2"></i>
                          Thay đổi mật khẩu
                        </Button>
                      </div>
                    </div>
                  </Col>
                </Row>
              </form>
            </div>
          </Tab>

          {/* Tab 3: Đăng ký (nếu có) */}
          {user?.subscription && (
            <Tab
              eventKey="subscription"
              title={
                <>
                  <i className="bi bi-star me-2"></i>Đăng ký
                </>
              }
            >
              <div className="p-4">
                <div className="subscription-card bg-gradient-primary rounded-4 p-4 mb-4 text-white">
                  <div className="d-flex align-items-center mb-3">
                    <div
                      className={`h-3 w-3 rounded-circle ${
                        user.subscription.status === "active"
                          ? "bg-success"
                          : "bg-danger"
                      } me-2 pulse-animation`}
                    ></div>
                    <h3 className="fs-4 fw-bold mb-0">
                      {user.subscription.status === "active"
                        ? "Đăng ký đang hoạt động"
                        : "Đăng ký không hoạt động"}
                    </h3>
                  </div>

                  {user.subscription.status === "active" && (
                    <Row className="subscription-details">
                      <Col md={6} className="mb-3 mb-md-0">
                        <div className="subscription-info-card">
                          <p className="text-white-50 mb-1">Ngày bắt đầu</p>
                          <p className="fw-bold fs-5 mb-0">
                            {new Date(
                              user.subscription.startDate
                            ).toLocaleDateString("vi-VN", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="subscription-info-card">
                          <p className="text-white-50 mb-1">Ngày kết thúc</p>
                          <p className="fw-bold fs-5 mb-0">
                            {new Date(
                              user.subscription.endDate
                            ).toLocaleDateString("vi-VN", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </Col>
                    </Row>
                  )}
                </div>

                <div className="subscription-details-card bg-white p-4 rounded-4 shadow-sm">
                  <h3 className="fs-4 fw-bold mb-4">
                    <i className="bi bi-info-circle me-2"></i>
                    Chi tiết đăng ký
                  </h3>
                  <div className="table-responsive">
                    <table className="table table-borderless">
                      <tbody>
                        <tr>
                          <td className="text-secondary fw-medium">
                            <i className="bi bi-hash me-2"></i>
                            Mã đăng ký
                          </td>
                          <td className="fw-bold">
                            {user.subscription.subscriptionId?._id || "N/A"}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-secondary fw-medium">
                            <i className="bi bi-layers me-2"></i>
                            Gói
                          </td>
                          <td className="fw-bold">
                            {user.subscription.subscriptionId?.name ||
                              "Standard"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="d-flex flex-wrap gap-2 justify-content-end mt-4">
                    <Button variant="outline-success" className="btn-modern">
                      <i className="bi bi-gear me-2"></i>
                      Quản lý đăng ký
                    </Button>
                    {user.subscription.status === "active" && (
                      <Button variant="outline-danger" className="btn-modern">
                        <i className="bi bi-x-circle me-2"></i>
                        Hủy đăng ký
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Tab>
          )}

          {/* Tab 4: Voucher */}
          <Tab
            eventKey="vouchers"
            title={
              <>
                <i className="bi bi-tag me-2"></i>Voucher
              </>
            }
          >
            <div className="p-4">
              {voucherError && <Alert variant="danger">{voucherError}</Alert>}
              {voucherLoading ? (
                <div className="text-center">
                  <Spinner animation="border" />
                </div>
              ) : vouchers.length === 0 ? (
                <p className="text-center">Bạn không có voucher nào.</p>
              ) : (
                <ListGroup variant="flush">
                  {vouchers.map(({ voucherId, status }) => {
                    const expiryDate = new Date(voucherId.expires_at);
                    const now = new Date();
                    let label, badgeVariant;
                    if (status === "used") {
                      label = "Đã sử dụng";
                      badgeVariant = "secondary";
                    } else if (expiryDate <= now) {
                      label = "Đã hết hạn";
                      badgeVariant = "danger";
                    } else {
                      label = "Còn hiệu lực";
                      badgeVariant = "success";
                    }
                    return (
                      <ListGroup.Item
                        key={voucherId._id}
                        className="d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <h5 className="mb-1">{voucherId.code}</h5>
                          <small>
                            Giảm giá: {voucherId.discount_percentage}% (tối đa{" "}
                            {voucherId.max_discount.toLocaleString("vi-VN")
                              ? `${voucherId.max_discount.toLocaleString(
                                  "vi-VN"
                                )} VND`
                              : "0 VND"}
                            )
                          </small>
                          <br />
                          <small>
                            Hết hạn:{" "}
                            {expiryDate.toLocaleDateString("vi-VN", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </small>
                        </div>
                        <span
                          className={`badge bg-${badgeVariant} px-3 py-2 rounded-pill`}
                        >
                          {label}
                        </span>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              )}
            </div>
          </Tab>
        </Tabs>
      </div>

      {/* Cài đặt tài khoản */}
      <div className="bg-white rounded-4 shadow-sm p-4">
        <h2 className="fs-4 fw-bold mb-4">
          <i className="bi bi-gear me-2"></i>
          Cài đặt tài khoản
        </h2>
        <div className="d-flex flex-column gap-4">
          <div className="setting-card d-flex justify-content-between align-items-center">
            <div>
              <p className="mb-0 fw-bold">
                <i className="bi bi-envelope me-2 text-success"></i>
                Email thông báo
              </p>
              <p className="mb-0 small text-muted">
                Nhận email về hoạt động tài khoản và đơn hàng
              </p>
            </div>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="emailNotifications"
                defaultChecked
              />
            </div>
          </div>
          <hr />
          <div className="setting-card d-flex justify-content-between align-items-center">
            <div>
              <p className="mb-0 fw-bold">
                <i className="bi bi-megaphone me-2 text-success"></i>
                Nhận thông tin khuyến mãi
              </p>
              <p className="mb-0 small text-muted">
                Nhận email về khuyến mãi và sản phẩm mới
              </p>
            </div>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="marketingEmails"
              />
            </div>
          </div>
          <hr />
          <div className="setting-card d-flex justify-content-between align-items-center">
            <div>
              <p className="mb-0 fw-bold text-danger">
                <i className="bi bi-trash me-2"></i>
                Xóa tài khoản
              </p>
              <p className="mb-0 small text-muted">
                Xóa vĩnh viễn tài khoản và tất cả dữ liệu
              </p>
            </div>
            <Button variant="outline-danger" className="btn-modern">
              <i className="bi bi-trash me-2"></i>
              Xóa tài khoản
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}

export default ProfilePage;
