"use client";
import { Button as BootstrapButton, Spinner } from "react-bootstrap";

function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  loading = false,
  onClick,
  ...props
}) {
  // Map our variants to Bootstrap variants
  const variantMap = {
    primary: "primary",
    secondary: "secondary",
    outline: "outline-primary",
    danger: "danger",
  };

  // Map our sizes to Bootstrap sizes
  const sizeMap = {
    sm: "sm",
    md: "",
    lg: "lg",
  };

  return (
    <BootstrapButton
      type={type}
      variant={variantMap[variant] || variant}
      size={sizeMap[size]}
      className={className}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <Spinner
          as="span"
          animation="border"
          size="sm"
          role="status"
          aria-hidden="true"
          className="me-2"
        />
      )}
      {children}
    </BootstrapButton>
  );
}

export default Button;
