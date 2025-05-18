"use client";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Navbar as BootstrapNavbar,
  Nav,
  Container,
  NavDropdown,
  Badge,
  Offcanvas,
} from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";

function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Add page transition effect
  useEffect(() => {
    // Add a fade-in effect when the page loads
    document.body.classList.add("page-transition");

    // Remove the class after the animation completes
    const timeout = setTimeout(() => {
      document.body.classList.remove("page-transition");
    }, 300);

    return () => clearTimeout(timeout);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <BootstrapNavbar
        bg="white"
        expand="lg"
        fixed="top"
        className={`transition-all duration-300 ${
          scrolled ? "shadow-sm py-2" : "py-3"
        }`}
      >
        <Container>
          <BootstrapNavbar.Brand
            as={Link}
            to="/"
            className="fw-bold text-success"
          >
            Mạt Trà
          </BootstrapNavbar.Brand>
          <BootstrapNavbar.Toggle
            aria-controls="basic-navbar-nav"
            onClick={() => setShowMobileMenu(true)}
            className="border-0"
          >
            <i className="bi bi-list fs-4"></i>
          </BootstrapNavbar.Toggle>
          <BootstrapNavbar.Collapse
            id="basic-navbar-nav"
            className="d-none d-lg-block"
          >
            <Nav className="me-auto">
              <Nav.Link
                as={Link}
                to="/"
                className={`mx-2 ${
                  isActive("/")
                    ? "fw-bold text-success border-bottom border-success"
                    : ""
                }`}
              >
                Home
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/products"
                className={`mx-2 ${
                  isActive("/products")
                    ? "fw-bold text-success border-bottom border-success"
                    : ""
                }`}
              >
                Products
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/subscriptions"
                className={`mx-2 ${
                  isActive("/subscriptions")
                    ? "fw-bold text-success border-bottom border-success"
                    : ""
                }`}
              >
                Subscriptions
              </Nav.Link>
            </Nav>
            <Nav>
              {user ? (
                <>
                  <Nav.Link
                    as={Link}
                    to="/chat"
                    className={`mx-2 ${
                      isActive("/chat") ? "fw-bold text-success" : ""
                    }`}
                  >
                    <i className="bi bi-chat me-1"></i> Chat
                  </Nav.Link>
                  <Nav.Link
                    as={Link}
                    to="/cart"
                    className={`position-relative mx-2 ${
                      isActive("/cart") ? "fw-bold text-success" : ""
                    }`}
                  >
                    <i className="bi bi-cart me-1"></i> Cart
                    {cart.items && cart.items.length > 0 && (
                      <Badge
                        pill
                        bg="success"
                        className="position-absolute top-0 start-100 translate-middle"
                      >
                        {cart.items.length}
                      </Badge>
                    )}
                  </Nav.Link>
                  <NavDropdown
                    title={
                      <div className="d-inline-block">
                        <div
                          className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: "32px", height: "32px" }}
                        >
                          {user.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                      </div>
                    }
                    id="user-dropdown"
                    align="end"
                  >
                    <NavDropdown.Item disabled>
                      Logged in as {user.name}
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    {user.role === "admin" && (
                      <NavDropdown.Item
                        as={Link}
                        to="/admin"
                        active={isActive("/admin")}
                      >
                        Admin Dashboard
                      </NavDropdown.Item>
                    )}
                    <NavDropdown.Item
                      as={Link}
                      to="/profile"
                      active={isActive("/profile")}
                    >
                      Your Profile
                    </NavDropdown.Item>
                    <NavDropdown.Item
                      as={Link}
                      to="/orders"
                      active={isActive("/orders")}
                    >
                      Your Orders
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={handleLogout}>
                      Sign out
                    </NavDropdown.Item>
                  </NavDropdown>
                </>
              ) : (
                <>
                  <Nav.Link
                    as={Link}
                    to="/login"
                    className={isActive("/login") ? "fw-bold text-success" : ""}
                  >
                    Login
                  </Nav.Link>
                  <Nav.Link
                    as={Link}
                    to="/register"
                    className={`btn btn-success text-white ms-2 ${
                      isActive("/register") ? "fw-bold" : ""
                    }`}
                  >
                    Register
                  </Nav.Link>
                </>
              )}
            </Nav>
          </BootstrapNavbar.Collapse>
        </Container>
      </BootstrapNavbar>

      {/* Mobile Menu Offcanvas */}
      <Offcanvas
        show={showMobileMenu}
        onHide={() => setShowMobileMenu(false)}
        placement="end"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="fw-bold text-success">
            Mạt Trà
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column">
            <Nav.Link
              as={Link}
              to="/"
              className={`py-3 ${isActive("/") ? "fw-bold text-success" : ""}`}
              onClick={() => setShowMobileMenu(false)}
            >
              <i className="bi bi-house me-2"></i> Home
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/products"
              className={`py-3 ${
                isActive("/products") ? "fw-bold text-success" : ""
              }`}
              onClick={() => setShowMobileMenu(false)}
            >
              <i className="bi bi-box me-2"></i> Products
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/subscriptions"
              className={`py-3 ${
                isActive("/subscriptions") ? "fw-bold text-success" : ""
              }`}
              onClick={() => setShowMobileMenu(false)}
            >
              <i className="bi bi-calendar-check me-2"></i> Subscriptions
            </Nav.Link>

            {user ? (
              <>
                <hr />
                <Nav.Link
                  as={Link}
                  to="/chat"
                  className={`py-3 ${
                    isActive("/chat") ? "fw-bold text-success" : ""
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <i className="bi bi-chat me-2"></i> Chat
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/cart"
                  className={`py-3 position-relative ${
                    isActive("/cart") ? "fw-bold text-success" : ""
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <i className="bi bi-cart me-2"></i> Cart
                  {cart.items && cart.items.length > 0 && (
                    <Badge pill bg="success" className="ms-2">
                      {cart.items.length}
                    </Badge>
                  )}
                </Nav.Link>

                <hr />

                {user.role === "admin" && (
                  <Nav.Link
                    as={Link}
                    to="/admin"
                    className={`py-3 ${
                      isActive("/admin") ? "fw-bold text-success" : ""
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <i className="bi bi-speedometer2 me-2"></i> Admin Dashboard
                  </Nav.Link>
                )}
                <Nav.Link
                  as={Link}
                  to="/profile"
                  className={`py-3 ${
                    isActive("/profile") ? "fw-bold text-success" : ""
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <i className="bi bi-person me-2"></i> Your Profile
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/orders"
                  className={`py-3 ${
                    isActive("/orders") ? "fw-bold text-success" : ""
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <i className="bi bi-bag me-2"></i> Your Orders
                </Nav.Link>

                <hr />

                <Nav.Link
                  className="py-3 text-danger"
                  onClick={() => {
                    handleLogout();
                    setShowMobileMenu(false);
                  }}
                >
                  <i className="bi bi-box-arrow-right me-2"></i> Sign out
                </Nav.Link>
              </>
            ) : (
              <>
                <hr />
                <div className="d-grid gap-2 mt-3">
                  <Link
                    to="/login"
                    className={`btn btn-outline-success ${
                      isActive("/login") ? "fw-bold" : ""
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className={`btn btn-success text-white ${
                      isActive("/register") ? "fw-bold" : ""
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Register
                  </Link>
                </div>
              </>
            )}
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}

export default Navbar;
