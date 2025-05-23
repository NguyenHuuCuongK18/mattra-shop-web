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
        className={`modern-navbar transition-all duration-300 ${
          scrolled ? "shadow-sm py-2" : "py-3"
        }`}
      >
        <Container>
          <BootstrapNavbar.Brand
            as={Link}
            to="/"
            className="fw-bold text-success brand-logo"
          >
            Mạt Trà
          </BootstrapNavbar.Brand>
          <BootstrapNavbar.Toggle
            aria-controls="basic-navbar-nav"
            onClick={() => setShowMobileMenu(true)}
            className="border-0 navbar-toggler-modern"
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
                className={`nav-link-modern mx-2 ${
                  isActive("/") ? "active-link" : ""
                }`}
              >
                <i className="bi bi-house me-1"></i> Home
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/products"
                className={`nav-link-modern mx-2 ${
                  isActive("/products") ? "active-link" : ""
                }`}
              >
                <i className="bi bi-box me-1"></i> Products
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/subscriptions"
                className={`nav-link-modern mx-2 ${
                  isActive("/subscriptions") ? "active-link" : ""
                }`}
              >
                <i className="bi bi-star me-1"></i> Subscriptions
              </Nav.Link>
            </Nav>
            <Nav>
              {user ? (
                <>
                  <Nav.Link
                    as={Link}
                    to="/chat"
                    className={`nav-link-modern mx-2 ${
                      isActive("/chat") ? "active-link" : ""
                    }`}
                  >
                    <i className="bi bi-chat me-1"></i> Chat
                  </Nav.Link>
                  <Nav.Link
                    as={Link}
                    to="/cart"
                    className={`nav-link-modern position-relative mx-2 ${
                      isActive("/cart") ? "active-link" : ""
                    }`}
                  >
                    <i className="bi bi-cart me-1"></i> Cart
                    {cart.items && cart.items.length > 0 && (
                      <Badge
                        pill
                        bg="success"
                        className="position-absolute top-0 start-100 translate-middle badge-modern"
                      >
                        {cart.items.length}
                      </Badge>
                    )}
                  </Nav.Link>
                  <NavDropdown
                    title={
                      <div className="d-inline-block">
                        <div
                          className={`rounded-circle d-flex align-items-center justify-content-center avatar-navbar ${
                            user.avatar
                              ? "bg-transparent"
                              : "bg-success text-white"
                          }`}
                        >
                          {user.avatar ? (
                            <img
                              src={user.avatar || "/placeholder.svg"}
                              alt="Profile"
                              className="rounded-circle"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            user.name?.charAt(0).toUpperCase() || "U"
                          )}
                        </div>
                      </div>
                    }
                    id="user-dropdown"
                    align="end"
                    className="dropdown-modern"
                  >
                    <div className="dropdown-header-modern">
                      <div className="d-flex align-items-center p-3">
                        <div
                          className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
                            user.avatar
                              ? "bg-transparent"
                              : "bg-success text-white"
                          }`}
                          style={{ width: "48px", height: "48px" }}
                        >
                          {user.avatar ? (
                            <img
                              src={user.avatar || "/placeholder.svg"}
                              alt="Profile"
                              className="rounded-circle"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            user.name?.charAt(0).toUpperCase() || "U"
                          )}
                        </div>
                        <div>
                          <p className="fw-bold mb-0">{user.name}</p>
                          <p className="text-muted small mb-0">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <NavDropdown.Divider />
                    {user.role === "admin" && (
                      <NavDropdown.Item
                        as={Link}
                        to="/admin"
                        active={isActive("/admin")}
                        className="dropdown-item-modern"
                      >
                        <i className="bi bi-speedometer2 me-2"></i> Admin
                        Dashboard
                      </NavDropdown.Item>
                    )}
                    <NavDropdown.Item
                      as={Link}
                      to="/profile"
                      active={isActive("/profile")}
                      className="dropdown-item-modern"
                    >
                      <i className="bi bi-person me-2"></i> Your Profile
                    </NavDropdown.Item>
                    <NavDropdown.Item
                      as={Link}
                      to="/orders"
                      active={isActive("/orders")}
                      className="dropdown-item-modern"
                    >
                      <i className="bi bi-bag me-2"></i> Your Orders
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item
                      onClick={handleLogout}
                      className="dropdown-item-modern text-danger"
                    >
                      <i className="bi bi-box-arrow-right me-2"></i> Sign out
                    </NavDropdown.Item>
                  </NavDropdown>
                </>
              ) : (
                <>
                  <Nav.Link
                    as={Link}
                    to="/login"
                    className={`nav-link-modern mx-2 ${
                      isActive("/login") ? "active-link" : ""
                    }`}
                  >
                    <i className="bi bi-box-arrow-in-right me-1"></i> Login
                  </Nav.Link>
                  <Nav.Link
                    as={Link}
                    to="/register"
                    className={`btn btn-success text-white ms-2 btn-modern ${
                      isActive("/register") ? "fw-bold" : ""
                    }`}
                  >
                    <i className="bi bi-person-plus me-1"></i> Register
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
        className="mobile-menu-modern"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="fw-bold text-success">
            Mạt Trà
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column">
            {user && (
              <div className="mobile-user-profile mb-4">
                <div className="d-flex align-items-center p-3 bg-light rounded-4">
                  <div
                    className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
                      user.avatar ? "bg-transparent" : "bg-success text-white"
                    }`}
                    style={{ width: "60px", height: "60px" }}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar || "/placeholder.svg"}
                        alt="Profile"
                        className="rounded-circle"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span className="fs-3">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="mb-0 fw-bold fs-5">{user.name}</p>
                    <p className="mb-0 text-secondary">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            <Nav.Link
              as={Link}
              to="/"
              className={`mobile-nav-link ${
                isActive("/") ? "active-mobile-link" : ""
              }`}
              onClick={() => setShowMobileMenu(false)}
            >
              <i className="bi bi-house me-3"></i> Home
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/products"
              className={`mobile-nav-link ${
                isActive("/products") ? "active-mobile-link" : ""
              }`}
              onClick={() => setShowMobileMenu(false)}
            >
              <i className="bi bi-box me-3"></i> Products
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/subscriptions"
              className={`mobile-nav-link ${
                isActive("/subscriptions") ? "active-mobile-link" : ""
              }`}
              onClick={() => setShowMobileMenu(false)}
            >
              <i className="bi bi-calendar-check me-3"></i> Subscriptions
            </Nav.Link>

            {user ? (
              <>
                <hr className="my-3" />

                <Nav.Link
                  as={Link}
                  to="/chat"
                  className={`mobile-nav-link ${
                    isActive("/chat") ? "active-mobile-link" : ""
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <i className="bi bi-chat me-3"></i> Chat
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/cart"
                  className={`mobile-nav-link position-relative ${
                    isActive("/cart") ? "active-mobile-link" : ""
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <i className="bi bi-cart me-3"></i> Cart
                  {cart.items && cart.items.length > 0 && (
                    <Badge pill bg="success" className="ms-2 badge-modern">
                      {cart.items.length}
                    </Badge>
                  )}
                </Nav.Link>

                <hr className="my-3" />

                {user.role === "admin" && (
                  <Nav.Link
                    as={Link}
                    to="/admin"
                    className={`mobile-nav-link ${
                      isActive("/admin") ? "active-mobile-link" : ""
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <i className="bi bi-speedometer2 me-3"></i> Admin Dashboard
                  </Nav.Link>
                )}
                <Nav.Link
                  as={Link}
                  to="/profile"
                  className={`mobile-nav-link ${
                    isActive("/profile") ? "active-mobile-link" : ""
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <i className="bi bi-person me-3"></i> Your Profile
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/orders"
                  className={`mobile-nav-link ${
                    isActive("/orders") ? "active-mobile-link" : ""
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <i className="bi bi-bag me-3"></i> Your Orders
                </Nav.Link>

                <hr className="my-3" />

                <Nav.Link
                  className="mobile-nav-link text-danger"
                  onClick={() => {
                    handleLogout();
                    setShowMobileMenu(false);
                  }}
                >
                  <i className="bi bi-box-arrow-right me-3"></i> Sign out
                </Nav.Link>
              </>
            ) : (
              <>
                <hr className="my-3" />
                <div className="d-grid gap-3 mt-3">
                  <Link
                    to="/login"
                    className="btn btn-outline-success btn-lg btn-modern-outline"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <i className="bi bi-box-arrow-in-right me-2"></i> Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-success btn-lg text-white btn-modern"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <i className="bi bi-person-plus me-2"></i> Register
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
