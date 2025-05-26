"use client";

import { useState, useEffect } from "react";
import { Table, Badge, Form, InputGroup, Alert } from "react-bootstrap";
import { authAPI } from "../../utils/api";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Row, Col } from "react-bootstrap";

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
        console.error("Error fetching users:", error);
        setError("Failed to load users. Please try again later.");
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
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.username.trim()) errors.username = "Username is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      errors.email = "Email is invalid";

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
      console.error("Error saving user:", error);
      setError(error.response?.data?.message || "Failed to save user");
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
      console.error("Error deleting user:", error);
      setError(error.response?.data?.message || "Failed to delete user");
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
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fs-4 fw-bold mb-0">Users</h1>
        <Button onClick={handleAddUser}>Add User</Button>
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
                placeholder="Search by name, email, or username"
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
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </Form.Select>
          </div>
        </div>
      </div>

      <Card>
        <div className="table-responsive">
          <Table hover className="mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th className="text-end">Actions</th>
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
                        {user.role}
                      </Badge>
                    </td>
                    {/* <td className="text-end">
                      <Button
                        variant="link"
                        className="text-primary p-0 me-3"
                        onClick={() => handleViewUser(user)}
                      >
                        View
                      </Button>
                      <Button
                        variant="link"
                        className="text-success p-0 me-3"
                        onClick={() => handleEditUser(user)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="link"
                        className="text-danger p-0"
                        onClick={() => handleDeleteUser(user)}
                      >
                        Delete
                      </Button>
                    </td> */}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* User Form Modal */}
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
                  {currentUser ? "Edit User" : "Add User"}
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
                    <Form.Label>Name</Form.Label>
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
                    <Form.Label>Username</Form.Label>
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
                    <Form.Label>Role</Form.Label>
                    <Form.Select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Address</Form.Label>
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
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        placeholder="Leave blank to generate random password"
                        onChange={handleInputChange}
                      />
                      <Form.Text className="text-muted">
                        If left blank, a random password will be generated and
                        sent to the user's email.
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
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  loading={formSubmitting}
                  disabled={formSubmitting}
                >
                  {currentUser ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
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
                  User Profile: {currentUser.name}
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
                      alt="Avatar"
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
                    <p className="text-secondary mb-1">Full Name</p>
                    <p className="fw-semibold mb-0">{currentUser.name}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-secondary mb-1">Username</p>
                    <p className="fw-semibold mb-0">{currentUser.username}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-secondary mb-1">Email</p>
                    <p className="fw-semibold mb-0">{currentUser.email}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-secondary mb-1">Role</p>
                    <Badge
                      bg={currentUser.role === "admin" ? "danger" : "success"}
                    >
                      {currentUser.role}
                    </Badge>
                  </Col>
                  <Col md={12} className="mb-3">
                    <p className="text-secondary mb-1">Address</p>
                    <p className="fw-semibold mb-0">
                      {currentUser.address || "Not provided"}
                    </p>
                  </Col>
                </Row>
                {currentUser.subscription && (
                  <>
                    <hr />
                    <h5 className="fw-semibold mb-3">Subscription Details</h5>
                    <Row>
                      <Col md={6} className="mb-3">
                        <p className="text-secondary mb-1">Status</p>
                        <p className="fw-semibold mb-0">
                          {currentUser.subscription.status === "active"
                            ? "Active"
                            : "Inactive"}
                        </p>
                      </Col>
                      <Col md={6} className="mb-3">
                        <p className="text-secondary mb-1">Subscription ID</p>
                        <p className="fw-semibold mb-0">
                          {currentUser.subscription.subscriptionId}
                        </p>
                      </Col>
                      <Col md={6} className="mb-3">
                        <p className="text-secondary mb-1">Plan</p>
                        <p className="fw-semibold mb-0">
                          {currentUser.subscription.plan || "Standard"}
                        </p>
                      </Col>
                      <Col md={6} className="mb-3">
                        <p className="text-secondary mb-1">Billing Cycle</p>
                        <p className="fw-semibold mb-0">
                          {currentUser.subscription.billingCycle || "Monthly"}
                        </p>
                      </Col>
                      {currentUser.subscription.status === "active" && (
                        <>
                          <Col md={6} className="mb-3">
                            <p className="text-secondary mb-1">Start Date</p>
                            <p className="fw-semibold mb-0">
                              {new Date(
                                currentUser.subscription.startDate
                              ).toLocaleDateString()}
                            </p>
                          </Col>
                          <Col md={6} className="mb-3">
                            <p className="text-secondary mb-1">End Date</p>
                            <p className="fw-semibold mb-0">
                              {new Date(
                                currentUser.subscription.endDate
                              ).toLocaleDateString()}
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
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete User</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={formSubmitting}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to delete the user "{currentUser?.name}
                  "?
                </p>
                <p className="text-danger mb-0">
                  This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <Button
                  variant="secondary"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={formSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleConfirmDelete}
                  loading={formSubmitting}
                  disabled={formSubmitting}
                >
                  Delete
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
