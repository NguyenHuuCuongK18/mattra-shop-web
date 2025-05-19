"use client";

import { useEffect, useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { Container, Navbar, Nav, Offcanvas } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";

function AdminLayout() {
  const [show, setShow] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Add admin-body class to body
    document.body.classList.add("admin-body");

    // Cleanup: Remove the class when component unmounts
    return () => {
      document.body.classList.remove("admin-body");
    };
  }, []);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    {
      path: "/admin",
      label: "Dashboard",
      icon: "bi-speedometer2",
    },
    {
      path: "/admin/products",
      label: "Products",
      icon: "bi-box-seam",
    },
    {
      path: "/admin/categories",
      label: "Categories",
      icon: "bi-tags",
    },
    {
      path: "/admin/orders",
      label: "Orders",
      icon: "bi-clipboard-check",
    },
    {
      path: "/admin/users",
      label: "Users",
      icon: "bi-people",
    },
    {
      path: "/admin/subscriptions",
      label: "Subscriptions",
      icon: "bi-credit-card",
    },
    {
      path: "/admin/vouchers",
      label: "Vouchers",
      icon: "bi-ticket-perforated",
    },
    {
      path: "/admin/prompt-categories",
      label: "Prompt Categories",
      icon: "bi-chat-left-text",
    },
  ];

  return (
    <div className="d-flex min-vh-100">
      {/* Sidebar for larger screens */}
      <div
        className="d-none d-md-flex flex-column bg-dark text-white"
        style={{ width: "250px", minHeight: "100vh" }}
      >
        <div className="d-flex align-items-center justify-content-center py-3 bg-success">
          <h2 className="fs-5 fw-bold mb-0">Mạt Trà Admin</h2>
        </div>

        <div className="p-3 border-bottom border-secondary">
          <div className="d-flex align-items-center">
            <div
              className="bg-success rounded-circle d-flex align-items-center justify-content-center me-2"
              style={{ width: "32px", height: "32px" }}
            >
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div>
              <p className="mb-0 small fw-medium">{user?.name || "Admin"}</p>
              <p className="mb-0 small text-secondary">
                {user?.email || "admin@example.com"}
              </p>
            </div>
          </div>
        </div>

        <Nav className="flex-column mt-2 flex-grow-1">
          {navItems.map((item) => (
            <Nav.Link
              key={item.path}
              as={Link}
              to={item.path}
              className={`px-3 py-2 d-flex align-items-center ${
                location.pathname === item.path
                  ? "bg-success bg-opacity-25 text-white"
                  : "text-secondary"
              }`}
            >
              <i className={`${item.icon} me-2`}></i>
              {item.label}
            </Nav.Link>
          ))}

          <div className="mt-auto">
            <Nav.Link
              onClick={handleLogout}
              className="px-3 py-2 d-flex align-items-center text-danger"
            >
              <i className="bi bi-box-arrow-right me-2"></i>
              Logout
            </Nav.Link>
          </div>
        </Nav>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column">
        <Navbar bg="white" expand={false} className="shadow-sm">
          <Container fluid className="px-3">
            <Navbar.Toggle
              onClick={handleShow}
              className="d-md-none"
              aria-controls="sidebar-nav"
            />
            <Navbar.Brand className="d-md-none">Mạt Trà Admin</Navbar.Brand>
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/" className="text-success">
                View Store
              </Nav.Link>
            </Nav>
          </Container>
        </Navbar>

        {/* Mobile Sidebar */}
        <Offcanvas
          show={show}
          onHide={handleClose}
          className="bg-dark text-white"
          style={{ maxWidth: "250px" }}
        >
          <Offcanvas.Header
            closeButton
            closeVariant="white"
            className="bg-success"
          >
            <Offcanvas.Title>Mạt Trà Admin</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="p-0">
            <div className="p-3 border-bottom border-secondary">
              <div className="d-flex align-items-center">
                <div
                  className="bg-success rounded-circle d-flex align-items-center justify-content-center me-2"
                  style={{ width: "32px", height: "32px" }}
                >
                  {user?.name?.charAt(0).toUpperCase() || "A"}
                </div>
                <div>
                  <p className="mb-0 small fw-medium">
                    {user?.name || "Admin"}
                  </p>
                  <p className="mb-0 small text-secondary">
                    {user?.email || "admin@example.com"}
                  </p>
                </div>
              </div>
            </div>

            <Nav className="flex-column">
              {navItems.map((item) => (
                <Nav.Link
                  key={item.path}
                  as={Link}
                  to={item.path}
                  onClick={handleClose}
                  className={`px-3 py-2 d-flex align-items-center ${
                    location.pathname === item.path
                      ? "bg-success bg-opacity-25 text-white"
                      : "text-secondary"
                  }`}
                >
                  <i className={`${item.icon} me-2`}></i>
                  {item.label}
                </Nav.Link>
              ))}

              <Nav.Link
                onClick={() => {
                  handleClose();
                  handleLogout();
                }}
                className="px-3 py-2 d-flex align-items-center text-danger mt-3"
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Logout
              </Nav.Link>
            </Nav>
          </Offcanvas.Body>
        </Offcanvas>

        <main className="flex-grow-1 bg-light p-3 p-md-4 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
