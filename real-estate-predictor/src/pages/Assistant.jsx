import { useEffect, useRef, useState } from "react";
import AssistantMessage from "../components/AssistantMessage";
import { getAiHealth, streamAiAssistant } from "../services/ai";
import "./Assistant.css";

// Each suggestion exercises a different agent tool.
const suggestions = [
  "Which city is the cheapest per sq ft?",
  "Estimate a 3 BHK apartment of 1,500 sq ft in Noida",
  "Compare Saket and Golf Course Road",
  "What factors affect prices the most?",
];

const FEATURES = [
  {
    label: "Plans & uses tools",
    icon: "M9 4h6M8 4H6a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-2M9 11h6M9 15h4",
  },
  {
    label: "Cited sources",
    icon: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  },
  {
    label: "Private & local",
    icon: "M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6zM9.5 12l1.8 1.8 3.5-3.6",
  },
];

const ICON_PATHS = {
  chat: "M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM12 7.8l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8v.01",
  arrow: "M5 12h14M13 6l6 6-6 6",
  retry: "M4 4v6h6M5.5 15A7.5 7.5 0 1 0 6 8.5L4 10",
  send: "M4 12 20 4l-6 16-3-7z",
  stop: "M7 7h10v10H7z",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
};

const HISTORY_TURNS = 6;

function Icon({ name, className = "assistant-icon" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

let messageCounter = 0;
const nextId = () => {
  messageCounter += 1;
  return messageCounter;
};

function statusMessage(health, healthError, checking) {
  if (checking) return "Checking the AI service…";
  if (healthError) return healthError;
  if (health?.status === "ready") {
    return `Agent ready · ${health.chat_model} via local Ollama · ${health.knowledge_chunks} guide passages indexed`;
  }
  if (health?.status === "degraded") {
    return `Data mode — answers come straight from the dataset and price model. ${health.detail}`;
  }
  return health?.detail || "The AI service is unavailable.";
}

function Assistant() {
  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState("");
  const [healthRetry, setHealthRetry] = useState(0);
  const [checkingHealth, setCheckingHealth] = useState(true);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [isSending, setIsSending] = useState(false);
  const abortRef = useRef(null);
  const conversationRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    setCheckingHealth(true);
    getAiHealth()
      .then((result) => {
        if (mounted) {
          setHealth(result);
          setHealthError("");
        }
      })
      .catch(() => {
        if (mounted) {
          setHealth(null);
          setHealthError(
            "The AI service is not running. Start it on port 8002 (see rag_genai/README.md), then retry.",
          );
        }
      })
      .finally(() => {
        if (mounted) setCheckingHealth(false);
      });

    return () => {
      mounted = false;
    };
  }, [healthRetry]);

  // Scroll only the chat panel, never the whole page.
  useEffect(() => {
    const panel = conversationRef.current;
    if (panel) panel.scrollTop = panel.scrollHeight;
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const updateMessage = (id, update) => {
    setMessages((previous) =>
      previous.map((message) => (message.id === id ? { ...message, ...update(message) } : message)),
    );
  };

  const ask = async (text) => {
    const message = text.trim();
    if (!message || isSending) return;

    const history = messages
      .filter((item) => item.content && item.status !== "error")
      .slice(-HISTORY_TURNS)
      .map((item) => ({ role: item.role, content: item.content }));

    const assistantId = nextId();
    setQuestion("");
    setMessages((previous) => [
      ...previous,
      { id: nextId(), role: "user", content: message, status: "done", steps: [], sources: [], cards: [] },
      {
        id: assistantId,
        role: "assistant",
        content: "",
        status: "streaming",
        steps: [],
        sources: [],
        cards: [],
        mode: null,
        error: "",
      },
    ]);
    setIsSending(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamAiAssistant(
        message,
        history,
        (event) => {
          switch (event.type) {
            case "step":
              updateMessage(assistantId, (m) => ({ steps: [...m.steps, event] }));
              break;
            case "sources":
              updateMessage(assistantId, () => ({ sources: event.sources }));
              break;
            case "data":
              updateMessage(assistantId, () => ({ cards: event.cards }));
              break;
            case "token":
              updateMessage(assistantId, (m) => ({
                content: event.replace ? event.text : m.content + event.text,
              }));
              break;
            case "done":
              updateMessage(assistantId, () => ({
                content: event.answer,
                mode: event.mode,
                sources: event.sources,
                cards: event.cards,
                status: "done",
              }));
              break;
            case "error":
              updateMessage(assistantId, () => ({ status: "error", error: event.detail }));
              break;
            default:
              break;
          }
        },
        controller.signal,
      );
    } catch (error) {
      const stopped = error.name === "AbortError";
      updateMessage(assistantId, (m) => ({
        status: stopped && m.content ? "done" : "error",
        error: stopped
          ? m.content
            ? ""
            : "Stopped."
          : error.message === "Failed to fetch"
            ? "Cannot reach the AI service. Make sure it is running on port 8002."
            : error.message,
      }));
    } finally {
      // Close any message the stream left open (e.g. connection dropped).
      updateMessage(assistantId, (m) => (m.status === "streaming" ? { status: "done" } : {}));
      abortRef.current = null;
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const serviceUp = Boolean(health) && health.status !== "unavailable";
  const statusClass = checkingHealth
    ? "is-checking"
    : health?.status === "ready"
      ? "is-ready"
      : health?.status === "degraded"
        ? "is-degraded"
        : "is-offline";

  return (
    <section className="assistant-page">
      <header className="assistant-heading">
        <div className="assistant-heading-copy">
          <span className="assistant-eyebrow">
            <span className="assistant-eyebrow-icon" aria-hidden="true">
              <Icon name="chat" />
            </span>
            Agentic AI assistant
            <span className="assistant-eyebrow-divider" aria-hidden="true" />
            <span className="assistant-eyebrow-meta">Runs locally</span>
          </span>

          <h1>
            Ask EstateIQ about{" "}
            <span className="assistant-accent">property.</span>
          </h1>

          <p>
            The agent <strong>plans each question</strong>, queries the dataset
            and price model, searches the guide, and answers with{" "}
            <strong>cited sources</strong>.
          </p>
        </div>

        <ul className="assistant-features" aria-label="Assistant features">
          {FEATURES.map((feature) => (
            <li key={feature.label}>
              <span className="assistant-feature-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={feature.icon} />
                </svg>
              </span>
              {feature.label}
            </li>
          ))}
        </ul>

        <svg
          className="assistant-skyline"
          viewBox="0 0 520 120"
          preserveAspectRatio="xMaxYMax meet"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M0 120V96h26V70h18v26h14V52l16-12 16 12v68h12V84h22V60h10V40h14v20h10v60h14V74l22-14 22 14v46h16V30h12V14h8v16h12v90h14V88h20v32h18V64h24v56h16V44l20-10 20 10v76h14V80h26v40" />
        </svg>
      </header>

      <div className="assistant-card">
        <div className={`assistant-status ${statusClass}`} role="status">
          <span className="assistant-status-dot" aria-hidden="true" />
          <span className="assistant-status-text">
            {statusMessage(health, healthError, checkingHealth)}
          </span>
          {!checkingHealth && health?.status !== "ready" && (
            <button
              type="button"
              className="assistant-retry"
              onClick={() => setHealthRetry((attempt) => attempt + 1)}
            >
              <Icon name="retry" />
              Recheck
            </button>
          )}
          {messages.length > 0 && (
            <button
              type="button"
              className="assistant-retry"
              onClick={() => setMessages([])}
              disabled={isSending}
            >
              <Icon name="trash" />
              New chat
            </button>
          )}
        </div>

        <div className="assistant-conversation" aria-live="polite" ref={conversationRef}>
          {messages.length === 0 ? (
            <div className="assistant-welcome">
              <span className="assistant-welcome-mark" aria-hidden="true">
                <Icon name="chat" />
              </span>
              <h2>What would you like to know?</h2>
              <p>
                Ask about prices, comparisons, quick estimates or how
                valuations work. Answers use historical data, not live listings.
              </p>
              <div className="assistant-suggestions">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => ask(suggestion)}
                    disabled={isSending || !serviceUp}
                  >
                    <span>{suggestion}</span>
                    <Icon name="arrow" className="assistant-suggestion-arrow" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <AssistantMessage
                key={message.id}
                message={message}
                chatModel={health?.chat_model || "the local model"}
              />
            ))
          )}
        </div>

        <form
          className="assistant-form"
          onSubmit={(event) => {
            event.preventDefault();
            ask(question);
          }}
        >
          <label className="assistant-sr-only" htmlFor="assistant-question">
            Ask a property question
          </label>
          <input
            id="assistant-question"
            ref={inputRef}
            type="text"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={2000}
            placeholder={
              serviceUp
                ? "Ask about prices, a city, or a quick estimate…"
                : "Start the AI service to ask questions"
            }
            disabled={isSending || !serviceUp}
          />
          {isSending ? (
            <button type="button" className="is-stop" onClick={() => abortRef.current?.abort()}>
              <Icon name="stop" />
              Stop
            </button>
          ) : (
            <button type="submit" disabled={!question.trim() || !serviceUp}>
              <Icon name="send" />
              Ask
            </button>
          )}
        </form>
        <p className="assistant-footnote">
          <Icon name="info" />
          Estimates are indicative and based on historical data, not live
          listings. For a full valuation, use Predict Price.
        </p>
      </div>
    </section>
  );
}

export default Assistant;
