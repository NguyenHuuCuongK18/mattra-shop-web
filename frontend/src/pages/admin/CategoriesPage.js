// src/pages/CategoriesPage.js
"use client";

import { useState, useEffect } from "react";
import { Table, Form, Alert } from "react-bootstrap";
import { categoryAPI } from "../../utils/api";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const response = await categoryAPI.getAllCategories();
        setCategories(response.data.categories || []);
      } catch (error) {
        console.error("Lỗi khi tải danh mục:", error);
        setError("Không thể tải danh mục. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Xóa lỗi khi người dùng nhập lại
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Tên danh mục là bắt buộc";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddCategory = () => {
    setCurrentCategory(null);
    setFormData({
      name: "",
      description: "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEditCategory = (category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDeleteCategory = (category) => {
    setCurrentCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setFormSubmitting(true);
    try {
      let response;
      if (currentCategory) {
        // Cập nhật danh mục
        response = await categoryAPI.updateCategory(
          currentCategory._id,
          formData
        );
      } else {
        // Tạo mới danh mục
        response = await categoryAPI.createCategory(formData);
      }

      // Cập nhật danh sách
      if (currentCategory) {
        setCategories(
          categories.map((c) =>
            c._id === currentCategory._id ? response.data.category : c
          )
        );
      } else {
        setCategories([...categories, response.data.category]);
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Lỗi khi lưu danh mục:", error);
      setError(error.response?.data?.message || "Không thể lưu danh mục");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentCategory) return;

    setFormSubmitting(true);
    try {
      await categoryAPI.deleteCategory(currentCategory._id);

      // Xóa khỏi danh sách
      setCategories(categories.filter((c) => c._id !== currentCategory._id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Lỗi khi xóa danh mục:", error);
      setError(error.response?.data?.message || "Không thể xóa danh mục");
    } finally {
      setFormSubmitting(false);
    }
  };

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
        <h1 className="fs-4 fw-bold mb-0">Danh mục</h1>
        <Button onClick={handleAddCategory}>Thêm danh mục</Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Card>
        <div className="table-responsive">
          <Table hover className="mb-0">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Mô tả</th>
                <th>Số sản phẩm</th>
                <th className="text-end">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {categories.length > 0 ? (
                categories.map((category) => (
                  <tr key={category._id}>
                    <td>{category.name}</td>
                    <td>{category.description || "-"}</td>
                    <td>{category.productCount || 0}</td>
                    <td className="text-end">
                      <Button
                        variant="link"
                        className="text-success p-0 me-3"
                        onClick={() => handleEditCategory(category)}
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="link"
                        className="text-danger p-0"
                        onClick={() => handleDeleteCategory(category)}
                      >
                        Xóa
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    Không tìm thấy danh mục
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Modal thêm/sửa danh mục */}
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
                  {currentCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục"}
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
                    <Form.Label>Tên danh mục</Form.Label>
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
                    <Form.Label>Mô tả</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
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
                  {currentCategory ? "Cập nhật" : "Tạo"}
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
                <h5 className="modal-title">Xóa danh mục</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={formSubmitting}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  Bạn có chắc chắn muốn xóa danh mục "{currentCategory?.name}"
                  không?
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

export default CategoriesPage;
