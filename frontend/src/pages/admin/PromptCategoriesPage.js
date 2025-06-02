"use client";

import { useState, useEffect } from "react";
import { Table, Form, Alert } from "react-bootstrap";
import { promptCategoryAPI } from "../../utils/api";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";

function PromptCategoriesPage() {
  const [promptCategories, setPromptCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    promptText: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    const fetchPromptCategories = async () => {
      setLoading(true);
      try {
        const response = await promptCategoryAPI.getAllPromptCategories();
        setPromptCategories(response.data.promptCategories || []);
      } catch (error) {
        console.error("Lỗi khi tải danh mục prompt:", error, error.response);
        setError("Không thể tải danh mục prompt. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchPromptCategories();
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
    if (!formData.name.trim()) errors.name = "Tên bắt buộc";
    if (!formData.promptText.trim())
      errors.promptText = "Nội dung prompt bắt buộc";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddCategory = () => {
    setCurrentCategory(null);
    setFormData({
      name: "",
      promptText: "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEditCategory = (category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      promptText: category.promptText,
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
        // Cập nhật
        response = await promptCategoryAPI.updatePromptCategory(
          currentCategory._id,
          formData
        );
      } else {
        // Tạo mới
        response = await promptCategoryAPI.createPromptCategory(formData);
      }

      // Cập nhật danh sách
      if (currentCategory) {
        setPromptCategories(
          promptCategories.map((c) =>
            c._id === currentCategory._id ? response.data.promptCategory : c
          )
        );
      } else {
        setPromptCategories([
          ...promptCategories,
          response.data.promptCategory,
        ]);
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Lỗi khi lưu danh mục prompt:", error, error.response);
      setError(
        error.response?.data?.message || "Không thể lưu danh mục prompt"
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentCategory) return;

    setFormSubmitting(true);
    try {
      await promptCategoryAPI.deletePromptCategory(currentCategory._id);

      // Xóa khỏi danh sách
      setPromptCategories(
        promptCategories.filter((c) => c._id !== currentCategory._id)
      );
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Lỗi khi xóa danh mục prompt:", error, error.response);
      setError(
        error.response?.data?.message || "Không thể xóa danh mục prompt"
      );
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
        <h1 className="fs-4 fw-bold mb-0">Danh mục Prompt</h1>
        <Button onClick={handleAddCategory}>Thêm danh mục Prompt</Button>
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
                <th>Nội dung Prompt</th>
                <th className="text-end">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {promptCategories.length > 0 ? (
                promptCategories.map((category) => (
                  <tr key={category._id}>
                    <td>{category.name}</td>
                    <td className="text-truncate" style={{ maxWidth: "400px" }}>
                      {category.promptText}
                    </td>
                    <td className="text-end">
                      <Button
                        variant="link"
                        className="text-success p-0 me-3"
                        onClick={() => handleEditCategory(category)}
                      >
                        Chỉnh sửa
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
                  <td colSpan="3" className="text-center py-4">
                    Không tìm thấy danh mục Prompt
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Modal Thêm / Chỉnh sửa Prompt Category */}
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
                  {currentCategory
                    ? "Chỉnh sửa danh mục Prompt"
                    : "Thêm danh mục Prompt"}
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
                    <Form.Label>Tên</Form.Label>
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
                    <Form.Label>Nội dung Prompt</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="promptText"
                      value={formData.promptText}
                      onChange={handleInputChange}
                      isInvalid={!!formErrors.promptText}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {formErrors.promptText}
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      Đây là nội dung sẽ gửi đến AI khi người dùng chọn prompt
                      này.
                    </Form.Text>
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

      {/* Modal Xóa Prompt Category */}
      {isDeleteModalOpen && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Xóa danh mục Prompt</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={formSubmitting}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  Bạn có chắc muốn xóa danh mục Prompt "{currentCategory?.name}
                  "?
                </p>
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

export default PromptCategoriesPage;
