"use client";

import { useState, useEffect } from "react";
import { Table, Badge, Form, InputGroup, Alert } from "react-bootstrap";
import { voucherAPI, authAPI } from "../../utils/api";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { toast } from "react-hot-toast";

function VouchersPage() {
  const [vouchers, setVouchers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentVoucher, setCurrentVoucher] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    code: "",
    discount_percentage: "",
    max_discount: "",
    expiry_date: "",
    subscriberOnly: false,
    description: "",
  });
  const [assignFormData, setAssignFormData] = useState({
    userId: "",
    voucherId: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [vouchersResponse, usersResponse] = await Promise.all([
          voucherAPI.getAllVouchers(),
          authAPI.getAllUsers(),
        ]);
        setVouchers(vouchersResponse.data.vouchers || []);
        setUsers(usersResponse.data.users || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load vouchers or users. Please try again later.");
        toast.error("Failed to load vouchers or users");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }
  };

  const handleAssignInputChange = (e) => {
    const { name, value } = e.target;
    setAssignFormData({
      ...assignFormData,
      [name]: value,
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.code?.trim()) errors.code = "Code is required";
    if (!formData.discount_percentage)
      errors.discount_percentage = "Discount percentage is required";
    else if (
      isNaN(formData.discount_percentage) ||
      Number(formData.discount_percentage) <= 0 ||
      Number(formData.discount_percentage) > 100
    )
      errors.discount_percentage =
        "Discount percentage must be between 1 and 100";
    if (
      formData.max_discount &&
      (isNaN(formData.max_discount) || Number(formData.max_discount) < 0)
    )
      errors.max_discount = "Max discount must be non-negative";
    if (!formData.expiry_date) errors.expiry_date = "Expiry date is required";
    else if (new Date(formData.expiry_date) <= new Date())
      errors.expiry_date = "Expiry date must be in the future";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddVoucher = () => {
    setCurrentVoucher(null);
    // Set default expiry date to 30 days from now
    const defaultExpiryDate = new Date();
    defaultExpiryDate.setDate(defaultExpiryDate.getDate() + 30);
    const formattedDate = defaultExpiryDate.toISOString().split("T")[0];

    setFormData({
      code: generateVoucherCode(),
      discount_percentage: "",
      max_discount: "",
      expiry_date: formattedDate,
      subscriberOnly: false,
      description: "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const generateVoucherCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleEditVoucher = (voucher) => {
    setCurrentVoucher(voucher);
    setFormData({
      code: voucher.code,
      discount_percentage: voucher.discount_percentage.toString(),
      max_discount: voucher.max_discount ? voucher.max_discount.toString() : "",
      expiry_date: new Date(voucher.expires_at).toISOString().split("T")[0],
      subscriberOnly: voucher.subscriberOnly || false,
      description: voucher.description || "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDeleteVoucher = (voucher) => {
    setCurrentVoucher(voucher);
    setIsDeleteModalOpen(true);
  };

  const handleAssignVoucher = (voucher) => {
    setCurrentVoucher(voucher);
    setAssignFormData({
      userId: "",
      voucherId: voucher._id,
    });
    setIsAssignModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setFormSubmitting(true);
    try {
      const voucherData = {
        code: formData.code,
        discount_percentage: Number.parseFloat(formData.discount_percentage),
        max_discount: formData.max_discount
          ? Number.parseFloat(formData.max_discount)
          : 0,
        expires_at: new Date(formData.expiry_date).toISOString(),
        subscriberOnly: formData.subscriberOnly,
        description: formData.description,
      };

      let response;
      if (currentVoucher) {
        // Update existing voucher
        response = await voucherAPI.updateVoucher(
          currentVoucher._id,
          voucherData
        );
        toast.success("Voucher updated successfully");
      } else {
        // Create new voucher
        response = await voucherAPI.createVoucher(voucherData);
        toast.success("Voucher created successfully");
      }

      // Update vouchers list
      if (currentVoucher) {
        setVouchers(
          vouchers.map((v) =>
            v._id === currentVoucher._id ? response.data.voucher : v
          )
        );
      } else {
        setVouchers([...vouchers, response.data.voucher]);
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving voucher:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to save voucher";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentVoucher) return;

    setFormSubmitting(true);
    try {
      await voucherAPI.deleteVoucher(currentVoucher._id);

      // Remove voucher from list
      setVouchers(vouchers.filter((v) => v._id !== currentVoucher._id));
      setIsDeleteModalOpen(false);
      toast.success("Voucher deleted successfully");
    } catch (error) {
      console.error("Error deleting voucher:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to delete voucher";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAssignConfirm = async (e) => {
    e.preventDefault();
    if (!assignFormData.userId || !assignFormData.voucherId) {
      toast.error("Please select a user");
      return;
    }

    setFormSubmitting(true);
    try {
      await voucherAPI.assignVoucher(
        assignFormData.voucherId,
        assignFormData.userId
      );

      toast.success("Voucher assigned successfully");
      setIsAssignModalOpen(false);
    } catch (error) {
      console.error("Error assigning voucher:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to assign voucher";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const isVoucherExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  const filteredVouchers = vouchers.filter((voucher) => {
    return searchQuery
      ? voucher.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          voucher.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
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
        <h1 className="fs-4 fw-bold mb-0">Vouchers</h1>
        <Button onClick={handleAddVoucher}>Add Voucher</Button>
      </div>

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

      <div className="mb-4">
        <InputGroup>
          <InputGroup.Text>
            <i className="bi bi-search"></i>
          </InputGroup.Text>
          <Form.Control
            placeholder="Search by code or description"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
      </div>

      <Card>
        <div className="table-responsive">
          <Table hover className="mb-0">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Expiry Date</th>
                <th>Subscriber Only</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVouchers.length > 0 ? (
                filteredVouchers.map((voucher) => (
                  <tr key={voucher._id}>
                    <td>{voucher.code}</td>
                    <td>
                      {voucher.discount_percentage}%
                      {voucher.max_discount > 0 &&
                        ` (Max: $${voucher.max_discount})`}
                    </td>
                    <td>{new Date(voucher.expires_at).toLocaleDateString()}</td>
                    <td>{voucher.subscriberOnly ? "Yes" : "No"}</td>
                    <td>
                      <Badge
                        bg={
                          isVoucherExpired(voucher.expires_at)
                            ? "danger"
                            : voucher.is_used
                            ? "secondary"
                            : "success"
                        }
                      >
                        {isVoucherExpired(voucher.expires_at)
                          ? "Expired"
                          : voucher.is_used
                          ? "Used"
                          : "Active"}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <Button
                        variant="link"
                        className="text-success p-0 me-3"
                        onClick={() => handleEditVoucher(voucher)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="link"
                        className="text-primary p-0 me-3"
                        onClick={() => handleAssignVoucher(voucher)}
                      >
                        Assign
                      </Button>
                      <Button
                        variant="link"
                        className="text-danger p-0"
                        onClick={() => handleDeleteVoucher(voucher)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No vouchers found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Voucher Form Modal */}
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
                  {currentVoucher ? "Edit Voucher" : "Add Voucher"}
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
                    <Form.Label>Voucher Code</Form.Label>
                    <Form.Control
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      isInvalid={!!formErrors.code}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {formErrors.code}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <div className="row">
                    <div className="col-md-6">
                      <Form.Group className="mb-3">
                        <Form.Label>Discount Percentage (%)</Form.Label>
                        <Form.Control
                          type="number"
                          name="discount_percentage"
                          value={formData.discount_percentage}
                          onChange={handleInputChange}
                          isInvalid={!!formErrors.discount_percentage}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {formErrors.discount_percentage}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group className="mb-3">
                        <Form.Label>Max Discount ($)</Form.Label>
                        <Form.Control
                          type="number"
                          name="max_discount"
                          value={formData.max_discount}
                          onChange={handleInputChange}
                          isInvalid={!!formErrors.max_discount}
                        />
                        <Form.Control.Feedback type="invalid">
                          {formErrors.max_discount}
                        </Form.Control.Feedback>
                        <Form.Text className="text-muted">Optional</Form.Text>
                      </Form.Group>
                    </div>
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label>Expiry Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="expiry_date"
                      value={formData.expiry_date}
                      onChange={handleInputChange}
                      isInvalid={!!formErrors.expiry_date}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {formErrors.expiry_date}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      name="subscriberOnly"
                      label="Subscriber Only"
                      checked={formData.subscriberOnly}
                      onChange={handleInputChange}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
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
                  {currentVoucher ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Voucher Modal */}
      {isAssignModalOpen && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Assign Voucher</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsAssignModalOpen(false)}
                  disabled={formSubmitting}
                ></button>
              </div>
              <div className="modal-body">
                <Form onSubmit={handleAssignConfirm}>
                  <Form.Group className="mb-3">
                    <Form.Label>Voucher Code</Form.Label>
                    <Form.Control
                      type="text"
                      value={currentVoucher?.code || ""}
                      disabled
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Select User</Form.Label>
                    <Form.Select
                      name="userId"
                      value={assignFormData.userId}
                      onChange={handleAssignInputChange}
                      required
                    >
                      <option value="">Choose a user</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name || user.username} ({user.email})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Form>
              </div>
              <div className="modal-footer">
                <Button
                  variant="secondary"
                  onClick={() => setIsAssignModalOpen(false)}
                  disabled={formSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAssignConfirm}
                  loading={formSubmitting}
                  disabled={formSubmitting}
                >
                  Assign
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
                <h5 className="modal-title">Delete Voucher</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={formSubmitting}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to delete the voucher code "
                  {currentVoucher?.code}"?
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

export default VouchersPage;
