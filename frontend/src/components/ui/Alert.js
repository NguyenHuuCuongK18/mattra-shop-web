"use client";
import React from "react";

const Alert = ({
  variant = "primary",
  children,
  className = "",
  dismissible = false,
  onClose,
  ...props
}) => {
  const getVariantClasses = () => {
    const variants = {
      primary: "alert-primary",
      secondary: "alert-secondary",
      success: "alert-success",
      danger: "alert-danger",
      warning: "alert-warning",
      info: "alert-info",
      light: "alert-light",
      dark: "alert-dark",
    };
    return variants[variant] || variants.primary;
  };

  return (
    <div
      className={`alert ${getVariantClasses()} ${
        dismissible ? "alert-dismissible" : ""
      } ${className}`}
      role="alert"
      {...props}
    >
      {children}
      {dismissible && onClose && (
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={onClose}
        ></button>
      )}
    </div>
  );
};

export default Alert;
