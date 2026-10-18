import { Fragment } from "react";
import "./AssistantMessage.css";

const TOOL_ICONS = {
  planner: "M9 4h6M8 4H6a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-2M9 11h6M9 15h4",
  memory: "M12 8v4l3 2M4 12a8 8 0 1 0 2.3-5.7L4 8.5M4 4v4.5h4.5",
  market_stats: "M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6",
  compare_markets: "M4 7h16M4 7l3-3M4 7l3 3M20 17H4M20 17l-3-3M20 17l-3 3",
  estimate_price: "M12 3v18M16.5 7.5c0-1.7-2-3-4.5-3s-4.5 1.3-4.5 3 2 2.6 4.5 3 4.5 1.3 4.5 3-2 3-4.5 3-4.5-1.3-4.5-3",
  model_factors: "M4 19V9M10 19V5M16 19v-7M22 19H2",
  search_knowledge: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
  self_check: "M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6zM9.5 12l1.8 1.8 3.5-3.6",
  llm: "M12 3l1.9 5.6 5.6 1.9-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z",
};

function ToolIcon({ tool }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={TOOL_ICONS[tool] || TOOL_ICONS.planner} />
    </svg>
  );
}

// Inline markdown subset: **bold** and [n] citation markers.
function renderInline(text, onCite) {
  return text.split(/(\*\*[^*]+\*\*|\[\d+\])/g).map((part, index) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    const citation = part.match(/^\[(\d+)\]$/);
    if (citation) {
      return (
        <button
          type="button"
          key={index}
          className="am-cite"
          onClick={() => onCite(Number(citation[1]))}
          aria-label={`Show source ${citation[1]}`}
        >
          {citation[1]}
        </button>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

// Block markdown subset: paragraphs and "- " bullet lists.
function RichText({ text, onCite }) {
  const blocks = text.trim().split(/\n{2,}/);
  return blocks.map((block, index) => {
    const lines = block.split("\n");
    const bullets = lines.filter((line) => /^\s*[-*•]\s+/.test(line));
    if (bullets.length && bullets.length >= lines.length - 1) {
      const lead = lines.find((line) => !/^\s*[-*•]\s+/.test(line));
      return (
        <div key={index}>
          {lead && <p>{renderInline(lead, onCite)}</p>}
          <ul>
            {bullets.map((line, i) => (
              <li key={i}>{renderInline(line.replace(/^\s*[-*•]\s+/, ""), onCite)}</li>
            ))}
          </ul>
        </div>
      );
    }
    return <p key={index}>{renderInline(lines.join(" "), onCite)}</p>;
  });
}

function DataCard({ card }) {
  if (card.kind === "estimate") {
    return (
      <div className="am-card am-card-estimate">
        <span className="am-card-kicker">Model estimate</span>
        <strong className="am-estimate">{card.estimate_label}</strong>
        <span className="am-estimate-rate">
          ₹{Math.round(card.price_per_sqft).toLocaleString("en-IN")} / sq ft
        </span>
        <dl>
          {Object.entries(card.inputs).map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  if (card.kind === "stats") {
    return (
      <div className="am-card">
        <span className="am-card-kicker">Dataset · {card.title}</span>
        <div className="am-metrics">
          {card.metrics.map((metric) => (
            <div key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (card.kind === "compare") {
    return (
      <div className="am-card">
        <span className="am-card-kicker">Market comparison</span>
        <table className="am-table">
          <thead>
            <tr>
              <th scope="col">Market</th>
              <th scope="col">Median price</th>
              <th scope="col">Per sq ft</th>
              <th scope="col">Records</th>
            </tr>
          </thead>
          <tbody>
            {card.rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.median_price}</td>
                <td>{row.median_ppsf}</td>
                <td>{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (card.kind === "factors") {
    const max = Math.max(...card.factors.map((factor) => factor.share), 1);
    return (
      <div className="am-card">
        <span className="am-card-kicker">What drives the model</span>
        <ul className="am-bars">
          {card.factors.map((factor) => (
            <li key={factor.factor}>
              <span>{factor.factor}</span>
              <span className="am-bar" aria-hidden="true">
                <span style={{ width: `${(factor.share / max) * 100}%` }} />
              </span>
              <strong>{factor.share}%</strong>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return null;
}

function AssistantMessage({ message, chatModel }) {
  const isUser = message.role === "user";
  const streaming = message.status === "streaming";

  const focusSource = (number) => {
    document
      .getElementById(`am-source-${message.id}-${number}`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  if (isUser) {
    return (
      <article className="am-message am-user">
        <p>{message.content}</p>
      </article>
    );
  }

  return (
    <article className="am-message am-assistant" aria-busy={streaming}>
      <header className="am-head">
        <span className="am-avatar" aria-hidden="true">
          <ToolIcon tool="llm" />
        </span>
        <strong>EstateIQ Agent</strong>
        {message.mode && (
          <span className={`am-mode am-mode-${message.mode}`}>
            {message.mode === "llm" ? `Written by ${chatModel}` : "Answered from data"}
          </span>
        )}
      </header>

      {message.steps.length > 0 && (
        <details className="am-steps" open={streaming}>
          <summary>
            {streaming ? "Working…" : `${message.steps.length} agent steps`}
          </summary>
          <ol>
            {message.steps.map((step, index) => (
              <li key={index}>
                <span className="am-step-icon">
                  <ToolIcon tool={step.tool} />
                </span>
                {step.label}
              </li>
            ))}
          </ol>
        </details>
      )}

      {message.cards.length > 0 && (
        <div className="am-cards">
          {message.cards.map((card, index) => (
            <DataCard card={card} key={index} />
          ))}
        </div>
      )}

      {message.content ? (
        <div className="am-answer">
          <RichText text={message.content} onCite={focusSource} />
          {streaming && <span className="am-caret" aria-hidden="true" />}
        </div>
      ) : (
        streaming && (
          <div className="am-typing" role="status">
            <span />
            <span />
            <span />
            <span className="assistant-sr-only">Thinking</span>
          </div>
        )
      )}

      {message.error && (
        <p className="am-error" role="alert">
          {message.error}
        </p>
      )}

      {message.sources.length > 0 && !streaming && (
        <div className="am-sources">
          <strong>Sources</strong>
          <ol>
            {message.sources.map((source) => (
              <li key={source.number} id={`am-source-${message.id}-${source.number}`}>
                <span className="am-source-number">{source.number}</span>
                <span className="am-source-text">
                  {source.title}
                  <small>{source.source}</small>
                </span>
                <span className={`am-source-kind am-kind-${source.kind}`}>
                  {source.kind === "data" ? "Data" : "Guide"}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </article>
  );
}

export default AssistantMessage;
