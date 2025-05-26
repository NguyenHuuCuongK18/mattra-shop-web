// src/pages/RegisterPage.js
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../utils/api"; // ← import the new endpoint
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    verificationCode: "", // ← new
    password: "",
    confirmPassword: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState("");
  const [codeError, setCodeError] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Request email verification code
  const handleRequestCode = async () => {
    if (!formData.email) {
      setCodeError("Please enter your email first");
      return;
    }
    try {
      setCodeLoading(true);
      setCodeError("");
      await authAPI.requestEmailVerification(formData.email);
      setCodeSent(true);
    } catch (err) {
      setCodeError(err.response?.data?.message || "Failed to send code");
    } finally {
      setCodeLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Front-end validations
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!formData.verificationCode) {
      setError("Verification code is required");
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...userData } = formData;
      await register(userData); // will POST { …, verificationCode } to /register
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Card>
        <Card.Header>
          <h1 className="text-2xl font-bold text-center text-gray-900">
            Create an Account
          </h1>
        </Card.Header>
        <Card.Body>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />

              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              {/* Email + “Request Code” button */}
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleRequestCode}
                  loading={codeLoading}
                  disabled={codeLoading}
                  className="h-10 self-end"
                >
                  Request Code
                </Button>
              </div>
              {codeError && <p className="text-sm text-red-600">{codeError}</p>}
              {codeSent && (
                <p className="text-sm text-green-600">
                  Code sent! Check your email.
                </p>
              )}

              {/* New Verification Code input */}
              <Input
                label="Verification Code"
                name="verificationCode"
                value={formData.verificationCode}
                onChange={handleChange}
                required
              />

              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />

              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />

              <Input
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />

              <Button
                type="submit"
                className="w-full"
                loading={loading}
                disabled={loading}
              >
                Sign up
              </Button>
            </div>
          </form>
        </Card.Body>
        <Card.Footer>
          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in
            </Link>
          </p>
        </Card.Footer>
      </Card>
    </div>
  );
}

export default RegisterPage;
