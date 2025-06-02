// src/pages/VouchersPage.js
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
        console.error("Lỗi khi tải dữ liệu:", error);
        setError(
          "Không thể tải phiếu giảm giá hoặc người dùng. Vui lòng thử lại sau."
        );
        toast.error("Không thể tải dữ liệu");
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
    // Xóa lỗi khi người dùng nhập lại
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
    if (!formData.code?.trim()) errors.code = "Mã phiếu là bắt buộc";
    if (!formData.discount_percentage)
      errors.discount_percentage = "Phần trăm giảm giá là bắt buộc";
    else if (
      isNaN(formData.discount_percentage) ||
      Number(formData.discount_percentage) <= 0 ||
      Number(formData.discount_percentage) > 100
    )
      errors.discount_percentage =
        "Phần trăm giảm giá phải nằm trong khoảng 1 đến 100";
    if (
      formData.max_discount &&
      (isNaN(formData.max_discount) || Number(formData.max_discount) < 0)
    )
      errors.max_discount = "Giảm tối đa phải là số không âm";
    if (!formData.expiry_date) errors.expiry_date = "Ngày hết hạn là bắt buộc";
    else if (new Date(formData.expiry_date) <= new Date())
      errors.expiry_date = "Ngày hết hạn phải là ngày tương lai";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddVoucher = () => {
    setCurrentVoucher(null);
    // Mặc định ngày hết hạn là 30 ngày sau
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
        // Cập nhật phiếu giảm giá
        response = await voucherAPI.updateVoucher(
          currentVoucher._id,
          voucherData
        );
        toast.success("Cập nhật phiếu thành công");
      } else {
        // Tạo mới phiếu giảm giá
        response = await voucherAPI.createVoucher(voucherData);
        toast.success("Tạo phiếu thành công");
      }

      // Cập nhật danh sách
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
      console.error("Lỗi khi lưu phiếu:", error);
      const errorMsg =
        error.response?.data?.message || "Không thể lưu phiếu giảm giá";
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

      // Xóa khỏi danh sách
      setVouchers(vouchers.filter((v) => v._id !== currentVoucher._id));
      setIsDeleteModalOpen(false);
      toast.success("Xóa phiếu thành công");
    } catch (error) {
      console.error("Lỗi khi xóa phiếu:", error);
      const errorMsg =
        error.response?.data?.message || "Không thể xóa phiếu giảm giá";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAssignConfirm = async (e) => {
    e.preventDefault();
    if (!assignFormData.userId || !assignFormData.voucherId) {
      toast.error("Vui lòng chọn người dùng");
      return;
    }

    setFormSubmitting(true);
    try {
      await voucherAPI.assignVoucher(
        assignFormData.voucherId,
        assignFormData.userId
      );

      toast.success("Phân công phiếu thành công");
      setIsAssignModalOpen(false);
    } catch (error) {
      console.error("Lỗi khi phân công phiếu:", error);
      const errorMsg =
        error.response?.data?.message || "Không thể phân công phiếu";
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
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fs-4 fw-bold mb-0">Phiếu giảm giá</h1>
        <Button onClick={handleAddVoucher}>Thêm phiếu</Button>
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
            placeholder="Tìm kiếm theo mã hoặc mô tả"
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
                <th>Mã</th>
                <th>Giảm giá</th>
                <th>Ngày hết hạn</th>
                <th>Chỉ thành viên</th>
                <th>Trạng thái</th>
                <th className="text-end">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredVouchers.length > 0 ? (
                filteredVouchers.map((voucher) => (
                  <tr key={voucher._id}>
                    <td>{voucher.code}</td>
                    <td>
                      {voucher.discount_percentage}%{" "}
                      {voucher.max_discount > 0 &&
                        `(Tối đa: ${voucher.max_discount.toLocaleString(
                          "vi-VN"
                        )} VND)`}
                    </td>
                    <td>
                      {new Date(voucher.expires_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td>{voucher.subscriberOnly ? "Có" : "Không"}</td>
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
                          ? "Đã hết hạn"
                          : voucher.is_used
                          ? "Đã sử dụng"
                          : "Đang hoạt động"}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <Button
                        variant="link"
                        className="text-success p-0 me-3"
                        onClick={() => handleEditVoucher(voucher)}
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="link"
                        className="text-primary p-0 me-3"
                        onClick={() => handleAssignVoucher(voucher)}
                      >
                        Phân công
                      </Button>
                      <Button
                        variant="link"
                        className="text-danger p-0"
                        onClick={() => handleDeleteVoucher(voucher)}
                      >
                        Xóa
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    Không tìm thấy phiếu giảm giá
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Modal thêm/sửa phiếu */}
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
                  {currentVoucher ? "Chỉnh sửa phiếu" : "Thêm phiếu"}
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
                    <Form.Label>Mã phiếu</Form.Label>
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
                        <Form.Label>Phần trăm giảm giá (%)</Form.Label>
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
                        <Form.Label>Giảm tối đa (VND)</Form.Label>
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
                      </Form.Group>
                    </div>
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label>Ngày hết hạn</Form.Label>
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
                      label="Chỉ thành viên"
                      checked={formData.subscriberOnly}
                      onChange={handleInputChange}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Mô tả</Form.Label>
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
                  Hủy
                </Button>
                <Button
                  onClick={handleSubmit}
                  loading={formSubmitting}
                  disabled={formSubmitting}
                >
                  {currentVoucher ? "Cập nhật" : "Tạo"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal phân công phiếu */}
      {isAssignModalOpen && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Phân công phiếu</h5>
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
                    <Form.Label>Mã phiếu</Form.Label>
                    <Form.Control
                      type="text"
                      value={currentVoucher?.code || ""}
                      disabled
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Chọn người dùng</Form.Label>
                    <Form.Select
                      name="userId"
                      value={assignFormData.userId}
                      onChange={handleAssignInputChange}
                      required
                    >
                      <option value="">Chọn người dùng</option>
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
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAssignConfirm}
                  loading={formSubmitting}
                  disabled={formSubmitting}
                >
                  Phân công
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa */}
      {isDeleteModalOpen && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Xóa phiếu</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={formSubmitting}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  Bạn có chắc chắn muốn xóa phiếu giảm giá "
                  {currentVoucher?.code}" không?
                </p>
                <p className="text-danger mb-0">
                  Hành động này không thể hoàn tác.
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

export default VouchersPage;
