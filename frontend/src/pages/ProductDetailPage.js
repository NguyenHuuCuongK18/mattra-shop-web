"use client";

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Breadcrumb,
  Badge,
  InputGroup,
  Form,
  Alert,
  Tab,
  Tabs,
} from "react-bootstrap";
import { productAPI } from "../utils/api";
import Button from "../components/ui/Button";
import { useCart } from "../contexts/CartContext";
import { toast } from "react-hot-toast";

function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await productAPI.getProductById(id);
        console.log("Product response:", response.data);
        // Normalize product: rename _id to id
        const normalizedProduct = {
          ...response.data.product,
          id: response.data.product._id,
        };
        setProduct(normalizedProduct);

        // Fetch related products (same category)
        if (response.data.product.category) {
          const productsResponse = await productAPI.getAllProducts();
          console.log("All products response:", productsResponse.data);
          const related = productsResponse.data.products
            .filter(
              (p) =>
                p.category === response.data.product.category &&
                p._id !== response.data.product._id
            )
            .map((p) => ({ ...p, id: p._id })) // Normalize related products
            .slice(0, 4);
          setRelatedProducts(related);
        }
      } catch (error) {
        console.error(
          "Error fetching product:",
          error.response?.data || error.message
        );
        setError("Failed to load product. Please try again later.");
        toast.error("Failed to load product details");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    setQuantity(1);
    setAddedToCart(false);
  }, [id]);

  const handleQuantityChange = (value) => {
    const newQuantity = quantity + value;
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 1)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    try {
      await addToCart(product.id, quantity);
      setAddedToCart(true);
      toast.success(`${product.name} added to cart`);
      setTimeout(() => setAddedToCart(false), 3000);
    } catch (error) {
      console.error(
        "Error adding to cart:",
        error.response?.data || error.message
      );
      toast.error("Failed to add to cart");
    }
  };

  if (loading) {
    return (
      <Container className="py-5 fade-in">
        <div className="placeholder-glow">
          <div className="placeholder col-4 mb-3"></div>
          <Row>
            <Col md={6}>
              <div
                className="placeholder col-12 rounded"
                style={{ height: "400px" }}
              ></div>
            </Col>
            <Col md={6}>
              <div className="placeholder col-8 mb-3"></div>
              <div className="placeholder col-4 mb-3"></div>
              <div className="placeholder col-6 mb-3"></div>
              <div
                className="placeholder col-12 mb-3"
                style={{ height: "100px" }}
              ></div>
              <div className="placeholder col-4 mb-3"></div>
              <div className="placeholder col-12 mb-3"></div>
            </Col>
          </Row>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5 fade-in">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Link to="/products">
              <Button variant="outline">Back to Products</Button>
            </Link>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="py-5 fade-in">
        <div className="text-center py-5">
          <i className="bi bi-exclamation-circle fs-1 text-secondary mb-3"></i>
          <h2 className="fs-4 fw-semibold">Product not found</h2>
          <p className="text-secondary mb-4">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5 fade-in">
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>
          Home
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/products" }}>
          Products
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{product.name}</Breadcrumb.Item>
      </Breadcrumb>

      {addedToCart && (
        <Alert
          variant="success"
          className="d-flex align-items-center mb-4 fade-in"
        >
          <i className="bi bi-check-circle-fill me-2"></i>
          <div>
            <strong>{product.name}</strong> has been added to your cart.{" "}
            <Link to="/cart" className="alert-link">
              View Cart
            </Link>
          </div>
        </Alert>
      )}

      <div className="bg-white rounded-4 shadow-sm overflow-hidden mb-5">
        <Row className="g-0">
          <Col lg={6}>
            <div
              className="position-relative h-100"
              style={{ minHeight: "400px" }}
            >
              <img
                src={
                  product.imageUrl ||
                  "https://images.unsplash.com/photo-1523920290228-4f321a939b4c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
                }
                alt={product.name}
                className="w-100 h-100 object-fit-cover"
              />
              {product.stock <= 0 && (
                <div className="position-absolute top-0 end-0 bg-danger text-white px-3 py-2 m-3 rounded-pill">
                  Out of Stock
                </div>
              )}
            </div>
          </Col>
          <Col lg={6}>
            <div className="p-4 p-lg-5">
              <h1 className="fs-2 fw-bold mb-2">{product.name}</h1>
              <h2 className="fs-3 fw-bold text-success mb-3">
                ${product.price.toFixed(2)}
              </h2>

              <div className="mb-4">
                <p className="text-secondary">{product.description}</p>
              </div>

              {product.category && (
                <div className="mb-4">
                  <span className="badge bg-light text-dark px-3 py-2 rounded-pill">
                    {product.category}
                  </span>
                </div>
              )}

              <div className="mb-4">
                <Badge
                  bg={product.stock > 0 ? "success" : "danger"}
                  className="py-2 px-3"
                >
                  {product.stock > 0
                    ? `In Stock (${product.stock} available)`
                    : "Out of Stock"}
                </Badge>
              </div>

              {product.stock > 0 && (
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <InputGroup style={{ width: "140px" }}>
                      <Button
                        variant="outline"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                      >
                        -
                      </Button>
                      <Form.Control
                        type="number"
                        value={quantity}
                        readOnly
                        className="text-center"
                      />
                      <Button
                        variant="outline"
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= product.stock}
                      >
                        +
                      </Button>
                    </InputGroup>
                  </div>

                  <Button onClick={handleAddToCart} className="w-100 py-2">
                    Add to Cart
                  </Button>
                </div>
              )}

              <div className="mt-4">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-truck text-success me-2"></i>
                  <span>Free shipping on orders over $50</span>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-arrow-repeat text-success me-2"></i>
                  <span>30-day return policy</span>
                </div>
                <div className="d-flex align-items-center">
                  <i className="bi bi-shield-check text-success me-2"></i>
                  <span>Secure checkout</span>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      <Tabs defaultActiveKey="details" className="mb-4">
        <Tab eventKey="details" title="Product Details">
          <div className="bg-white p-4 rounded-bottom shadow-sm">
            <Row>
              <Col md={6}>
                <h3 className="fs-5 fw-semibold mb-3">Specifications</h3>
                <table className="table">
                  <tbody>
                    {product.category && (
                      <tr>
                        <td className="text-secondary border-0">Category</td>
                        <td className="border-0">{product.category}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="text-secondary border-0">SKU</td>
                      <td className="border-0">
                        {product.id.substring(0, 8).toUpperCase()}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-secondary border-0">Weight</td>
                      <td className="border-0">100g</td>
                    </tr>
                    <tr>
                      <td className="text-secondary border-0">Origin</td>
                      <td className="border-0">Vietnam</td>
                    </tr>
                  </tbody>
                </table>
              </Col>
              <Col md={6}>
                <h3 className="fs-5 fw-semibold mb-3">Care Instructions</h3>
                <p className="text-secondary">
                  Store in a cool, dry place away from direct sunlight. For best
                  flavor, consume within 6 months of opening.
                </p>
              </Col>
            </Row>
          </div>
        </Tab>
        <Tab eventKey="reviews" title="Reviews">
          <div className="bg-white p-4 rounded-bottom shadow-sm">
            <div className="text-center py-4">
              <i className="bi bi-star fs-1 text-secondary mb-3"></i>
              <h3 className="fs-5 fw-semibold">No reviews yet</h3>
              <p className="text-secondary mb-4">
                Be the first to review this product
              </p>
              <Button variant="outline">Write a Review</Button>
            </div>
          </div>
        </Tab>
      </Tabs>

      {relatedProducts.length > 0 && (
        <div className="mt-5">
          <h2 className="fs-3 fw-bold mb-4">You May Also Like</h2>
          <Row>
            {relatedProducts.map((relatedProduct) => (
              <Col key={relatedProduct.id} sm={6} md={3} className="mb-4">
                <div className="card border-0 shadow-sm h-100 product-card">
                  <div
                    className="position-relative overflow-hidden"
                    style={{ height: "180px", cursor: "pointer" }}
                    onClick={() =>
                      (window.location.href = `/products/${relatedProduct.id}`)
                    }
                  >
                    <img
                      src={
                        relatedProduct.imageUrl ||
                        "https://images.unsplash.com/photo-1523920290228-4f321a939b4c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
                      }
                      alt={relatedProduct.name}
                      className="w-100 h-100 object-fit-cover"
                    />
                  </div>
                  <div className="card-body d-flex flex-column">
                    <h3 className="fs-5 fw-semibold">{relatedProduct.name}</h3>
                    <p className="text-success fw-bold mb-2">
                      ${relatedProduct.price.toFixed(2)}
                    </p>
                    <p className="text-secondary small mb-3 flex-grow-1">
                      {relatedProduct.description &&
                        relatedProduct.description.substring(0, 60)}
                      ...
                    </p>

                    {relatedProduct.category && (
                      <div className="mb-3">
                        <span className="badge bg-light text-dark">
                          {relatedProduct.category}
                        </span>
                      </div>
                    )}

                    <Link
                      to={`/products/${relatedProduct.id}`}
                      className="w-100"
                    >
                      <Button variant="outline" className="w-100">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      )}
    </Container>
  );
}

export default ProductDetailPage;
