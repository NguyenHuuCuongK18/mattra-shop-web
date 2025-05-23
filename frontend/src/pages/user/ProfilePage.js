"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/ui/Button";
import { Container, Row, Col, Alert, Tabs, Tab, Form } from "react-bootstrap";

function ProfilePage() {
  const { user, updateProfile, changePassword, uploadAvatar } = useAuth();

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    address: user?.address || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Avatar state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarSuccess, setAvatarSuccess] = useState("");

  // Profile and password loading/error/success states
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

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
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setAvatarError("Please select an image file");
        return;
      }
      // Validate file size (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setAvatarError("File size must be less than 5MB");
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

    try {
      // Update profile information
      await updateProfile(profileData);
      setProfileSuccess("Profile updated successfully!");

      // Upload avatar if selected
      if (avatarFile) {
        await uploadAvatar(avatarFile);
        setAvatarSuccess("Avatar updated successfully!");
        setAvatarFile(null); // Clear file input
      }
    } catch (error) {
      console.error("Profile update error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update profile or avatar";
      setProfileError(errorMessage);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Passwords do not match");
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      setPasswordLoading(false);
      return;
    }

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordSuccess(
        "Password changed successfully! You will be logged out."
      );
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Change password error:", error);
      setPasswordError(
        error.response?.data?.message || "Failed to change password"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // Update avatar preview when user changes
  useEffect(() => {
    setAvatarPreview(user?.avatar || "");
  }, [user?.avatar]);

  return (
    <Container className="py-5 fade-in">
      <div className="profile-header bg-light rounded-4 p-4 mb-4 shadow-sm">
        <div className="d-flex flex-column flex-md-row align-items-center gap-4">
          <div className="profile-avatar-container">
            {avatarPreview ? (
              <img
                src={avatarPreview || "/placeholder.svg"}
                alt="Profile"
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
                  Premium Member
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-4 shadow-sm overflow-hidden mb-4">
        <Tabs defaultActiveKey="profile" className="profile-tabs">
          <Tab
            eventKey="profile"
            title={
              <>
                <i className="bi bi-person me-2"></i>Profile Information
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
                  <Col lg={4} className="mb-4">
                    <div className="text-center">
                      <div className="mb-3 avatar-upload-container mx-auto">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview || "/placeholder.svg"}
                            alt="Avatar Preview"
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
                          Profile Picture
                        </Form.Label>
                        <Form.Control
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="form-control-modern"
                        />
                        <Form.Text className="text-muted">
                          Upload an image (max 5MB, JPG/PNG)
                        </Form.Text>
                        {avatarError && (
                          <p className="text-danger mt-2 small">
                            {avatarError}
                          </p>
                        )}
                      </Form.Group>
                    </div>
                  </Col>
                  <Col lg={8}>
                    <Row>
                      <Col md={6} className="mb-3">
                        <div className="form-group-modern">
                          <label className="form-label fw-bold">Username</label>
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
                            Username cannot be changed
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
                            Email cannot be changed
                          </div>
                        </div>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6} className="mb-3">
                        <div className="form-group-modern">
                          <label className="form-label fw-bold">
                            Full Name
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
                          <label className="form-label fw-bold">Address</label>
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
                        loading={profileLoading}
                        disabled={profileLoading}
                        className="btn-modern"
                      >
                        <i className="bi bi-check-circle me-2"></i>
                        Update Profile
                      </Button>
                    </div>
                  </Col>
                </Row>
              </form>
            </div>
          </Tab>
          <Tab
            eventKey="password"
            title={
              <>
                <i className="bi bi-shield-lock me-2"></i>Change Password
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
                        Password Security
                      </h4>
                      <p className="text-secondary mb-4">
                        Ensure your account is using a strong password that is
                        updated regularly. Your password should be at least 6
                        characters and include a mix of letters, numbers, and
                        special characters.
                      </p>

                      <div className="form-group-modern mb-4">
                        <label className="form-label fw-bold">
                          Current Password
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
                              New Password
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
                              Confirm New Password
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
                          Change Password
                        </Button>
                      </div>
                    </div>
                  </Col>
                </Row>
              </form>
            </div>
          </Tab>
          {user?.subscription && (
            <Tab
              eventKey="subscription"
              title={
                <>
                  <i className="bi bi-star me-2"></i>Subscription
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
                        ? "Active Subscription"
                        : "Inactive Subscription"}
                    </h3>
                  </div>

                  {user.subscription.status === "active" && (
                    <Row className="subscription-details">
                      <Col md={6} className="mb-3 mb-md-0">
                        <div className="subscription-info-card">
                          <p className="text-white-50 mb-1">Start Date</p>
                          <p className="fw-bold fs-5 mb-0">
                            {new Date(
                              user.subscription.startDate
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="subscription-info-card">
                          <p className="text-white-50 mb-1">End Date</p>
                          <p className="fw-bold fs-5 mb-0">
                            {new Date(
                              user.subscription.endDate
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </Col>
                    </Row>
                  )}
                </div>

                <div className="subscription-details-card bg-white p-4 rounded-4 shadow-sm">
                  <h3 className="fs-4 fw-bold mb-4">
                    <i className="bi bi-info-circle me-2"></i>
                    Subscription Details
                  </h3>
                  <div className="table-responsive">
                    <table className="table table-borderless subscription-table">
                      <tbody>
                        <tr>
                          <td className="text-secondary fw-medium">
                            <i className="bi bi-hash me-2"></i>
                            Subscription ID
                          </td>
                          <td className="fw-bold">
                            {user.subscription.subscriptionId}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-secondary fw-medium">
                            <i className="bi bi-layers me-2"></i>
                            Plan
                          </td>
                          <td className="fw-bold">
                            {user.subscription.plan || "Standard"}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-secondary fw-medium">
                            <i className="bi bi-calendar-check me-2"></i>
                            Billing Cycle
                          </td>
                          <td className="fw-bold">
                            {user.subscription.billingCycle || "Monthly"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="d-flex flex-wrap gap-2 justify-content-end mt-4">
                    <Button variant="outline" className="btn-modern-outline">
                      <i className="bi bi-gear me-2"></i>
                      Manage Subscription
                    </Button>
                    {user.subscription.status === "active" && (
                      <Button
                        variant="outline"
                        className="btn-modern-outline text-danger"
                      >
                        <i className="bi bi-x-circle me-2"></i>
                        Cancel Subscription
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Tab>
          )}
        </Tabs>
      </div>

      <div className="bg-white rounded-4 shadow-sm p-4">
        <h2 className="fs-4 fw-bold mb-4">
          <i className="bi bi-gear me-2"></i>
          Account Settings
        </h2>
        <div className="d-flex flex-column gap-4">
          <div className="setting-card d-flex justify-content-between align-items-center">
            <div>
              <p className="mb-0 fw-bold">
                <i className="bi bi-envelope me-2 text-success"></i>
                Email Notifications
              </p>
              <p className="mb-0 small text-secondary">
                Receive emails about your account activity and orders
              </p>
            </div>
            <div className="form-check form-switch">
              <input
                className="form-check-input form-switch-modern"
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
                Marketing Communications
              </p>
              <p className="mb-0 small text-secondary">
                Receive emails about promotions and new products
              </p>
            </div>
            <div className="form-check form-switch">
              <input
                className="form-check-input form-switch-modern"
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
                Delete Account
              </p>
              <p className="mb-0 small text-secondary">
                Permanently delete your account and all data
              </p>
            </div>
            <Button
              variant="outline"
              className="btn-modern-outline text-danger"
            >
              <i className="bi bi-trash me-2"></i>
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}

export default ProfilePage;
