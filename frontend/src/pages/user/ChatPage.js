"use client";

import { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Spinner,
  Badge,
} from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import { geminiAIApi, promptCategoryAPI } from "../../utils/api";
import { toast } from "react-hot-toast";

const ChatPage = () => {
  const { user, isSubscriber } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [promptCategories, setPromptCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchPromptCategories = async () => {
      if (!user) return;

      setLoadingCategories(true);
      try {
        const response = await promptCategoryAPI.getAllPromptCategories();
        setPromptCategories(response.data.promptCategories || []);
      } catch (error) {
        console.error("Error fetching prompt categories:", error);
        toast.error("Failed to load prompt categories");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchPromptCategories();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      content: prompt,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setLoading(true);

    // Clear input after sending
    setPrompt("");

    try {
      let response;

      if (selectedCategory) {
        // Use combined endpoint if a category is selected
        response = await geminiAIApi.generateCombinedResponse(
          prompt,
          selectedCategory
        );
      } else {
        // Use default endpoint if no category is selected
        response = await geminiAIApi.generateDefaultResponse(prompt);
      }

      // Add AI response to chat
      const aiMessage = {
        id: Date.now() + 1,
        content: response.data.response,
        sender: "ai",
        timestamp: new Date().toISOString(),
      };

      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error("Error generating response:", error);
      toast.error("Failed to generate response");

      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        content: "Sorry, I couldn't generate a response. Please try again.",
        sender: "system",
        timestamp: new Date().toISOString(),
      };

      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryBadgeVariant = (type) => {
    switch (type) {
      case "diet":
        return "success";
      case "recipe":
        return "primary";
      case "info":
        return "info";
      default:
        return "secondary";
    }
  };

  if (!user) {
    return (
      <Container className="py-5">
        <Card className="border-0 shadow-sm rounded-4">
          <Card.Body className="text-center p-5">
            <i
              className="bi bi-lock-fill text-muted mb-3"
              style={{ fontSize: "3rem" }}
            ></i>
            <Card.Title className="mb-3 fs-2">Please Login</Card.Title>
            <Card.Text className="text-muted mb-4">
              You need to be logged in to access the chat feature.
            </Card.Text>
            <Button variant="success" href="/login" size="lg" className="px-4">
              <i className="bi bi-box-arrow-in-right me-2"></i>
              Login Now
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  // if (!isSubscriber()) {
  //   return (
  //     <Container className="py-5">
  //       <Card className="border-0 shadow-sm rounded-4">
  //         <Card.Body className="text-center p-5">
  //           <i
  //             className="bi bi-star-fill text-warning mb-3"
  //             style={{ fontSize: "3rem" }}
  //           ></i>
  //           <Card.Title className="mb-3 fs-2">Subscription Required</Card.Title>
  //           <Card.Text className="text-muted mb-4">
  //             You need to be a subscriber to access the chat feature.
  //           </Card.Text>
  //           <Button
  //             variant="success"
  //             href="/subscriptions"
  //             size="lg"
  //             className="px-4"
  //           >
  //             <i className="bi bi-gem me-2"></i>
  //             View Subscription Plans
  //           </Button>
  //         </Card.Body>
  //       </Card>
  //     </Container>
  //   );
  // }

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={10} xl={8}>
          <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
            <Card.Header className="bg-success text-white p-4 border-0">
              <div className="d-flex align-items-center">
                <i className="bi bi-robot fs-3 me-3"></i>
                <div>
                  <h5 className="mb-0 fw-bold">Mạt Trà AI Assistant</h5>
                  <p className="mb-0 small opacity-75">
                    Ask me anything about tea and wellness
                  </p>
                </div>
              </div>
            </Card.Header>

            {/* Chat Messages Area */}
            <div
              className="chat-messages p-3"
              style={{
                height: "400px",
                overflowY: "auto",
                backgroundColor: "#f8f9fa",
              }}
            >
              {messages.length === 0 ? (
                <div className="text-center my-5 py-5">
                  <i
                    className="bi bi-chat-dots text-muted"
                    style={{ fontSize: "3rem" }}
                  ></i>
                  <p className="text-muted mt-3">
                    Start a conversation with Mạt Trà AI
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`d-flex ${
                      message.sender === "user"
                        ? "justify-content-end"
                        : "justify-content-start"
                    } mb-3`}
                  >
                    {message.sender === "ai" && (
                      <div className="me-2">
                        <div
                          className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center"
                          style={{ width: "32px", height: "32px" }}
                        >
                          <i className="bi bi-robot"></i>
                        </div>
                      </div>
                    )}

                    <div
                      className={`message-bubble p-3 rounded-3 ${
                        message.sender === "user"
                          ? "bg-success text-white"
                          : message.sender === "ai"
                          ? "bg-white border"
                          : "bg-warning text-dark"
                      }`}
                      style={{
                        maxWidth: "75%",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {message.content}
                    </div>

                    {message.sender === "user" && (
                      <div className="ms-2">
                        <div
                          className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center"
                          style={{ width: "32px", height: "32px" }}
                        >
                          <i className="bi bi-person"></i>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              {loading && (
                <div className="d-flex justify-content-start mb-3">
                  <div className="me-2">
                    <div
                      className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center"
                      style={{ width: "32px", height: "32px" }}
                    >
                      <i className="bi bi-robot"></i>
                    </div>
                  </div>
                  <div
                    className="message-bubble p-3 rounded-3 bg-white border"
                    style={{ maxWidth: "75%" }}
                  >
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Category Selection */}
            <Card.Body className="border-top bg-white p-3">
              <Form.Group className="mb-3">
                <Form.Label className="d-flex justify-content-between align-items-center">
                  <span>Select a Category (Optional)</span>
                  {loadingCategories && (
                    <Spinner animation="border" size="sm" />
                  )}
                </Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  <Button
                    variant={
                      selectedCategory === "" ? "success" : "outline-secondary"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory("")}
                    className="rounded-pill"
                  >
                    No Category
                  </Button>
                  {promptCategories.map((category) => (
                    <Button
                      key={category._id || category.id}
                      variant={
                        selectedCategory === (category._id || category.id)
                          ? "success"
                          : "outline-secondary"
                      }
                      size="sm"
                      onClick={() =>
                        setSelectedCategory(category._id || category.id)
                      }
                      className="rounded-pill d-flex align-items-center"
                    >
                      {category.name}
                      <Badge
                        bg={getCategoryBadgeVariant(category.type)}
                        className="ms-2 rounded-pill"
                        style={{ fontSize: "0.65rem" }}
                      >
                        {category.type}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </Form.Group>

              {/* Input Form */}
              <Form onSubmit={handleSubmit}>
                <div className="input-group">
                  <Form.Control
                    as="textarea"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask anything about tea..."
                    required
                    className="rounded-start"
                    style={{ resize: "none", height: "60px" }}
                  />
                  <Button
                    variant="success"
                    type="submit"
                    disabled={loading || !prompt.trim()}
                    className="d-flex align-items-center justify-content-center"
                    style={{ width: "60px" }}
                  >
                    {loading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <i className="bi bi-send-fill fs-5"></i>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ChatPage;
