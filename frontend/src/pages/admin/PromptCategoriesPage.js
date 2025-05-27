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
        console.log("Prompt categories response:", response); // Debug log
        setPromptCategories(response.data.promptCategories || []);
      } catch (error) {
        console.error(
          "Error fetching prompt categories:",
          error,
          error.response
        );
        setError("Failed to load prompt categories. Please try again later.");
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
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.promptText.trim())
      errors.promptText = "Prompt text is required";

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
        // Update existing category
        response = await promptCategoryAPI.updatePromptCategory(
          currentCategory._id,
          formData
        );
        console.log("Update response:", response); // Debug log
      } else {
        // Create new category
        response = await promptCategoryAPI.createPromptCategory(formData);
        console.log("Create response:", response); // Debug log
      }

      // Update categories list
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
      console.error("Error saving prompt category:", error, error.response);
      setError(
        error.response?.data?.message || "Failed to save prompt category"
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentCategory) return;

    setFormSubmitting(true);
    try {
      const response = await promptCategoryAPI.deletePromptCategory(
        currentCategory._id
      );
      console.log("Delete response:", response); // Debug log

      // Remove category from list
      setPromptCategories(
        promptCategories.filter((c) => c._id !== currentCategory._id)
      );
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting prompt category:", error, error.response);
      setError(
        error.response?.data?.message || "Failed to delete prompt category"
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
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fs-4 fw-bold mb-0">Prompt Categories</h1>
        <Button onClick={handleAddCategory}>Add Prompt Category</Button>
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
                <th>Name</th>
                <th>Prompt Text</th>
                <th className="text-end">Actions</th>
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
                        Edit
                      </Button>
                      <Button
                        variant="link"
                        className="text-danger p-0"
                        onClick={() => handleDeleteCategory(category)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center py-4">
                    No prompt categories found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Prompt Category Form Modal */}
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
                    ? "Edit Prompt Category"
                    : "Add Prompt Category"}
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
                    <Form.Label>Prompt Text</Form.Label>
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
                      This is the text that will be sent to the AI when a user
                      selects this prompt.
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
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  loading={formSubmitting}
                  disabled={formSubmitting}
                >
                  {currentCategory ? "Update" : "Create"}
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
                <h5 className="modal-title">Delete Prompt Category</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={formSubmitting}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to delete the prompt category "
                  {currentCategory?.name}"?
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

export default PromptCategoriesPage;
