"use client";

import { useState, useEffect } from "react";
import { productAPI, categoryAPI } from "../../utils/api";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { toast } from "react-hot-toast";

function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    imageUrl: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          productAPI.getAllProducts(),
          categoryAPI.getAllCategories(),
        ]);
        setProducts(productsResponse.data.products || []);
        setCategories(categoriesResponse.data.categories || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load products. Please try again later.");
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when user types
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
    if (!formData.description.trim())
      errors.description = "Description is required";
    if (!formData.price) errors.price = "Price is required";
    else if (isNaN(formData.price) || Number.parseFloat(formData.price) <= 0)
      errors.price = "Price must be a positive number";
    if (!formData.stock) errors.stock = "Stock is required";
    else if (isNaN(formData.stock) || Number.parseInt(formData.stock) < 0)
      errors.stock = "Stock must be a non-negative number";
    if (!formData.category) errors.category = "Category is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddProduct = () => {
    setCurrentProduct(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
      imageUrl: "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category || "",
      imageUrl: product.imageUrl || "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (product) => {
    setCurrentProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setFormSubmitting(true);
    try {
      const productData = {
        ...formData,
        price: Number.parseFloat(formData.price),
        stock: Number.parseInt(formData.stock),
      };

      let response;
      if (currentProduct) {
        // Update existing product
        response = await productAPI.updateProduct(
          currentProduct.id,
          productData
        );
        toast.success("Product updated successfully");
      } else {
        // Create new product
        response = await productAPI.createProduct(productData);
        toast.success("Product created successfully");
      }

      // Update products list
      if (currentProduct) {
        setProducts(
          products.map((p) =>
            p.id === currentProduct.id ? response.data.product : p
          )
        );
      } else {
        setProducts([...products, response.data.product]);
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving product:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to save product";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentProduct) return;

    setFormSubmitting(true);
    try {
      await productAPI.deleteProduct(currentProduct.id);

      // Remove product from list
      setProducts(products.filter((p) => p.id !== currentProduct.id));
      setIsDeleteModalOpen(false);
      toast.success("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to delete product";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setFormSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Button onClick={handleAddProduct}>Add Product</Button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Product
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Price
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Stock
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img
                            className="h-10 w-10 rounded-md object-cover"
                            src={
                              product.imageUrl ||
                              "https://images.unsplash.com/photo-1523920290228-4f321a939b4c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" ||
                              "/placeholder.svg" ||
                              "/placeholder.svg"
                            }
                            alt={product.name}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.category || "Uncategorized"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {product.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Product Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {currentProduct ? "Edit Product" : "Add Product"}
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <Input
                      label="Name"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      error={formErrors.name}
                      required
                    />
                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows="3"
                        value={formData.description}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border ${
                          formErrors.description
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                        required
                      ></textarea>
                      {formErrors.description && (
                        <p className="mt-1 text-sm text-red-500">
                          {formErrors.description}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Price"
                        id="price"
                        name="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={handleInputChange}
                        error={formErrors.price}
                        required
                      />
                      <Input
                        label="Stock"
                        id="stock"
                        name="stock"
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={handleInputChange}
                        error={formErrors.stock}
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="category"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Category
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border ${
                          formErrors.category
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.category && (
                        <p className="mt-1 text-sm text-red-500">
                          {formErrors.category}
                        </p>
                      )}
                    </div>
                    <Input
                      label="Image URL"
                      id="imageUrl"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                      error={formErrors.imageUrl}
                    />
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button
                    type="submit"
                    className="w-full sm:w-auto sm:ml-3"
                    loading={formSubmitting}
                    disabled={formSubmitting}
                  >
                    {currentProduct ? "Update" : "Create"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3 w-full sm:mt-0 sm:w-auto"
                    onClick={() => setIsModalOpen(false)}
                    disabled={formSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg
                      className="h-6 w-6 text-red-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Product
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete {currentProduct?.name}?
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  type="button"
                  variant="danger"
                  className="w-full sm:w-auto sm:ml-3"
                  onClick={handleConfirmDelete}
                  loading={formSubmitting}
                  disabled={formSubmitting}
                >
                  Delete
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 w-full sm:mt-0 sm:w-auto"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={formSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProductsPage;
