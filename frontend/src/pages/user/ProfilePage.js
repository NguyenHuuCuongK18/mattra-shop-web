"use client";

import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/ui/Button";
import { Container, Row, Col, Alert, Tabs, Tab } from "react-bootstrap";

function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    address: user?.address || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
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

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      await updateProfile(profileData);
      setProfileSuccess("Profile updated successfully!");
    } catch (error) {
      console.error("Update profile error:", error);
      setProfileError(
        error.response?.data?.message || "Failed to update profile"
      );
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
      await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      setPasswordSuccess("Password changed successfully!");
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

  return (
    <Container className="py-5 fade-in">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4">
        <h1 className="fs-2 fw-bold mb-3 mb-md-0">My Profile</h1>
        <div className="d-flex align-items-center">
          <div
            className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-2"
            style={{ width: "40px", height: "40px" }}
          >
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <p className="mb-0 fw-semibold">{user?.name || "User"}</p>
            <p className="mb-0 small text-secondary">{user?.email || ""}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-4 shadow-sm overflow-hidden mb-4">
        <Tabs defaultActiveKey="profile" className="mb-0 border-0">
          <Tab eventKey="profile" title="Profile Information">
            <div className="p-4">
              <form onSubmit={handleProfileSubmit}>
                {profileError && <Alert variant="danger">{profileError}</Alert>}
                {profileSuccess && (
                  <Alert variant="success">{profileSuccess}</Alert>
                )}

                <Row>
                  <Col md={6} className="mb-3">
                    <div className="mb-3">
                      <label className="form-label">Username</label>
                      <input
                        type="text"
                        value={user?.username || ""}
                        className="form-control bg-light"
                        disabled
                      />
                      <div className="form-text">
                        Username cannot be changed
                      </div>
                    </div>
                  </Col>
                  <Col md={6} className="mb-3">
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        value={user?.email || ""}
                        className="form-control bg-light"
                        disabled
                      />
                      <div className="form-text">Email cannot be changed</div>
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col md={6} className="mb-3">
                    <div className="mb-3">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        value={profileData.name}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>
                  </Col>
                  <Col md={6} className="mb-3">
                    <div className="mb-3">
                      <label className="form-label">Address</label>
                      <input
                        type="text"
                        className="form-control"
                        id="address"
                        name="address"
                        value={profileData.address}
                        onChange={handleProfileChange}
                      />
                    </div>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end">
                  <Button
                    type="submit"
                    loading={profileLoading}
                    disabled={profileLoading}
                  >
                    Update Profile
                  </Button>
                </div>
              </form>
            </div>
          </Tab>
          <Tab eventKey="password" title="Change Password">
            <div className="p-4">
              <form onSubmit={handlePasswordSubmit}>
                {passwordError && (
                  <Alert variant="danger">{passwordError}</Alert>
                )}
                {passwordSuccess && (
                  <Alert variant="success">{passwordSuccess}</Alert>
                )}

                <Row>
                  <Col md={6} className="mb-3">
                    <div className="mb-3">
                      <label className="form-label">Current Password</label>
                      <input
                        type="password"
                        className="form-control"
                        id="currentPassword"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col md={6} className="mb-3">
                    <div className="mb-3">
                      <label className="form-label">New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        id="newPassword"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                  </Col>
                  <Col md={6} className="mb-3">
                    <div className="mb-3">
                      <label className="form-label">Confirm New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end">
                  <Button
                    type="submit"
                    loading={passwordLoading}
                    disabled={passwordLoading}
                  >
                    Change Password
                  </Button>
                </div>
              </form>
            </div>
          </Tab>
          {user?.subscription && (
            <Tab eventKey="subscription" title="Subscription">
              <div className="p-4">
                <div className="bg-light rounded-3 p-4 mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <div
                      className={`h-3 w-3 rounded-circle ${
                        user.subscription.status === "active"
                          ? "bg-success"
                          : "bg-danger"
                      } me-2`}
                    ></div>
                    <h3 className="fs-5 fw-semibold mb-0">
                      {user.subscription.status === "active"
                        ? "Active Subscription"
                        : "Inactive Subscription"}
                    </h3>
                  </div>

                  {user.subscription.status === "active" && (
                    <Row>
                      <Col md={6} className="mb-3 mb-md-0">
                        <div>
                          <p className="text-secondary mb-1">Start Date</p>
                          <p className="fw-semibold mb-0">
                            {new Date(
                              user.subscription.startDate
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div>
                          <p className="text-secondary mb-1">End Date</p>
                          <p className="fw-semibold mb-0">
                            {new Date(
                              user.subscription.endDate
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </Col>
                    </Row>
                  )}
                </div>

                <div>
                  <h3 className="fs-5 fw-semibold mb-3">
                    Subscription Details
                  </h3>
                  <table className="table">
                    <tbody>
                      <tr>
                        <td className="text-secondary border-0">
                          Subscription ID
                        </td>
                        <td className="border-0">
                          {user.subscription.subscriptionId}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-secondary border-0">Plan</td>
                        <td className="border-0">
                          {user.subscription.plan || "Standard"}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-secondary border-0">
                          Billing Cycle
                        </td>
                        <td className="border-0">
                          {user.subscription.billingCycle || "Monthly"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-end">
                  <Button variant="outline" className="me-2">
                    Manage Subscription
                  </Button>
                  {user.subscription.status === "active" && (
                    <Button variant="outline" className="text-danger">
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              </div>
            </Tab>
          )}
        </Tabs>
      </div>

      <div className="bg-white rounded-4 shadow-sm p-4">
        <h2 className="fs-5 fw-semibold mb-3">Account Settings</h2>
        <div className="d-flex flex-column gap-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <p className="mb-0 fw-medium">Email Notifications</p>
              <p className="mb-0 small text-secondary">
                Receive emails about your account activity and orders
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
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <p className="mb-0 fw-medium">Marketing Communications</p>
              <p className="mb-0 small text-secondary">
                Receive emails about promotions and new products
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
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <p className="mb-0 fw-medium text-danger">Delete Account</p>
              <p className="mb-0 small text-secondary">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="outline" className="text-danger">
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}

export default ProfilePage;
