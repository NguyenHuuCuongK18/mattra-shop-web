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
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// CSS nội tuyến cho Markdown
const markdownStyles = `
  .markdown-body ul {
    list-style-type: disc;
    margin-left: 20px;
    margin-bottom: 10px;
  }
  .markdown-body li {
    margin-bottom: 5px;
  }
  .markdown-body strong {
    font-weight: bold;
  }
  .markdown-body p {
    margin: 0 0 10px;
  }
`;

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
        console.error("Lỗi khi tải danh mục prompt:", error);
        toast.error("Không thể tải danh mục prompt");
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
      toast.error("Vui lòng nhập nội dung");
      return;
    }

    // Thêm tin nhắn của user
    const userMessage = {
      id: Date.now(),
      content: prompt,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setLoading(true);

    setPrompt("");

    try {
      let response;

      if (selectedCategory) {
        response = await geminiAIApi.generateCombinedResponse(
          prompt,
          selectedCategory
        );
      } else {
        response = await geminiAIApi.generateDefaultResponse(prompt);
      }

      // Thêm tin nhắn AI
      const aiMessage = {
        id: Date.now() + 1,
        content: response.data.response,
        sender: "ai",
        timestamp: new Date().toISOString(),
      };

      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error("Lỗi khi tạo câu trả lời AI:", error);
      toast.error("Không thể tạo câu trả lời");

      const errorMessage = {
        id: Date.now() + 1,
        content: "Xin lỗi, tôi không thể tạo câu trả lời. Vui lòng thử lại.",
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
            <Card.Title className="mb-3 fs-2">Vui lòng đăng nhập</Card.Title>
            <Card.Text className="text-muted mb-4">
              Bạn cần đăng nhập để sử dụng tính năng chat.
            </Card.Text>
            <Button variant="success" href="/login" size="lg" className="px-4">
              <i className="bi bi-box-arrow-in-right me-2"></i>
              Đăng nhập ngay
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <style>{markdownStyles}</style>
      <Row className="justify-content-center">
        <Col lg={10} xl={8}>
          <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
            <Card.Header className="bg-success text-white p-4 border-0">
              <div className="d-flex align-items-center">
                <i className="bi bi-robot fs-3 me-3"></i>
                <div>
                  <h5 className="mb-0 fw-bold">Mạt Trà AI Assistant</h5>
                  <p className="mb-0 small opacity-75">
                    Hỏi tôi bất cứ điều gì về trà và sức khỏe
                  </p>
                </div>
              </div>
            </Card.Header>

            {/* Khu vực hiển thị tin nhắn */}
            <div
              className="chat-messages p-3 markdown-body"
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
                    Bắt đầu cuộc trò chuyện với Mật Trà AI
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
                      }}
                    >
                      {message.sender === "ai" ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        message.content
                      )}
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

            {/* Chọn danh mục (nếu có) và form nhập */}
            <Card.Body className="border-top bg-white p-3">
              <Form.Group className="mb-3">
                <Form.Label className="d-flex justify-content-between align-items-center">
                  <span>Chọn danh mục (tùy chọn)</span>
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
                    Không chọn
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

              {/* Form nhập prompt */}
              <Form onSubmit={handleSubmit}>
                <div className="input-group">
                  <Form.Control
                    as="textarea"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Hỏi về trà..."
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
