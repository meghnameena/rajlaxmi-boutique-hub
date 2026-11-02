import { useState, useRef, useEffect } from "react";
import "./AIAssistant.css";

const API_URL = "http://localhost:5000/api/ai-agent";

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Namaste! 💖 Rajlaxmi Boutique mein aapka swagat hai. Aaj main aapki shopping mein kaise help kar sakti hoon?",
    },
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text = message) => {
    const userMessage = text.trim();

    if (!userMessage || loading) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Request failed");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "Maaf kijiye, mujhe jawab nahi mila.",
        },
      ]);
    } catch (error) {
      console.error("AI Chat Error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Maaf kijiye, abhi assistant se connection nahi ho pa raha. Please thodi der baad try karein. 💗",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

function renderMessage(content) {
  const markdownLinkRegex =
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

  const elements = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = markdownLinkRegex.exec(content)) !== null) {
    // Text before the link
    if (match.index > lastIndex) {
      elements.push(
        <span key={key++}>
          {content.slice(lastIndex, match.index)}
        </span>
      );
    }

    const [, label, url] = match;

    elements.push(
      <a
        key={key++}
        href={url}
        className="raj-ai-product-link"
      >
        🛍️ {label}
      </a>
    );

    lastIndex = markdownLinkRegex.lastIndex;
  }

  // Remaining text
  if (lastIndex < content.length) {
    elements.push(
      <span key={key++}>
        {content.slice(lastIndex)}
      </span>
    );
  }

  return elements;
}

  return (
    <div className="raj-ai-widget">
      {isOpen && (
        <section
          className="raj-ai-window"
          aria-label="Rajlaxmi Boutique AI Assistant"
        >
          <header className="raj-ai-header">
            <div className="raj-ai-brand">
              <div className="raj-ai-avatar">R</div>

              <div>
                <h3>Rajlaxmi Assistant</h3>
                <p>
                  <span className="raj-ai-online-dot" />
                  AI Shopping Assistant
                </p>
              </div>
            </div>

            <button
              className="raj-ai-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              type="button"
            >
              ×
            </button>
          </header>

          <div className="raj-ai-messages">
            <div className="raj-ai-date-label">
              SHOPPING ASSISTANT
            </div>

            {messages.map((item, index) => (
              <div
                key={index}
                className={`raj-ai-message-row ${
                  item.role === "user" ? "raj-ai-user-row" : ""
                }`}
              >
                {item.role === "assistant" && (
                  <span className="raj-ai-small-avatar">R</span>
                )}

                <div
                  className={`raj-ai-bubble ${
                    item.role === "user"
                      ? "raj-ai-user-bubble"
                      : "raj-ai-bot-bubble"
                  }`}
                >
                  {renderMessage(item.content)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="raj-ai-message-row">
                <span className="raj-ai-small-avatar">R</span>
                <div className="raj-ai-bubble raj-ai-bot-bubble raj-ai-typing">
                  Soch rahi hoon
                  <span> . . .</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="raj-ai-quick-actions">
            {[
              "Suits under ₹2000",
              "Show sarees",
              "Lehenga collection",
            ].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={loading}
                onClick={() => sendMessage(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <form className="raj-ai-input-area" onSubmit={handleSubmit}>
            <input
              type="text"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Apna sawaal likhein..."
              aria-label="Type your message"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || !message.trim()}
              aria-label="Send message"
            >
              ➤
            </button>
          </form>

          <footer className="raj-ai-footer">
            Powered by Rajlaxmi Boutique AI ✨
          </footer>
        </section>
      )}

      <button
        className={`raj-ai-launcher ${isOpen ? "raj-ai-launcher-open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
        aria-expanded={isOpen}
        type="button"
      >
        {isOpen ? (
          <span className="raj-ai-launcher-cross">×</span>
        ) : (
          <svg
            width="29"
            height="29"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-5.5A7.5 7.5 0 1 1 20 11.5Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M8 11h.01M12 11h.01M16 11h.01"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
