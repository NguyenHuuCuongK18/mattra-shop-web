"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Spinner,
} from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import { geminiAIApi, promptCategoryAPI } from "../../utils/api";
import { toast } from "react-hot-toast";

const ChatPage = () => {
  const { user, isSubscriber } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [promptCategories, setPromptCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setLoading(true);
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

      setResponse(response.data.response);
    } catch (error) {
      console.error("Error generating response:", error);
      toast.error("Failed to generate response");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container className="py-5">
        <Card className="text-center p-5">
          <Card.Body>
            <Card.Title>Please Login</Card.Title>
            <Card.Text>
              You need to be logged in to access the chat feature.
            </Card.Text>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (!isSubscriber()) {
    return (
      <Container className="py-5">
        <Card className="text-center p-5">
          <Card.Body>
            <Card.Title>Subscription Required</Card.Title>
            <Card.Text>
              You need to be a subscriber to access the chat feature.
            </Card.Text>
            <Button variant="primary" href="/subscriptions">
              View Subscription Plans
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row>
        <Col>
          <h1 className="mb-4">Chat with Mạt Trà AI</h1>

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Select a Category (Optional)</Form.Label>
              <Form.Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={loadingCategories}
              >
                <option value="">No Category (Default)</option>
                {promptCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} - {category.type}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Your Question</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask anything about tea..."
                required
              />
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              disabled={loading || !prompt.trim()}
              className="mb-4"
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                  <span className="ms-2">Generating...</span>
                </>
              ) : (
                "Ask AI"
              )}
            </Button>
          </Form>

          {response && (
            <Card className="mt-4">
              <Card.Header>AI Response</Card.Header>
              <Card.Body>
                <Card.Text style={{ whiteSpace: "pre-wrap" }}>
                  {response}
                </Card.Text>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ChatPage;
