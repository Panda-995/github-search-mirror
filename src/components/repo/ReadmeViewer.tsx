"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";

interface ReadmeViewerProps {
  content: string;
  repoName: string;
}

export function ReadmeViewer({ content, repoName }: ReadmeViewerProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!content) {
    return (
      <div
        className="p-8 text-center"
        style={{
          background: "rgba(255, 255, 255, 0.9)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          backdropFilter: "blur(8px)",
        }}
      >
        <FileText className="mx-auto h-8 w-8 mb-2" style={{ color: "var(--surface-300)" }} />
        <p className="text-sm" style={{ color: "var(--surface-400)" }}>
          暂无 README
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.9)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-5 py-3.5 text-left"
        style={{ borderBottom: isExpanded ? "1px solid var(--border-subtle)" : "none" }}
      >
        <div className="flex items-center gap-2">
          <FileText style={{ width: 16, height: 16, color: "var(--surface-400)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--surface-700)" }}>
            README.md
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp style={{ width: 16, height: 16, color: "var(--surface-400)" }} />
        ) : (
          <ChevronDown style={{ width: 16, height: 16, color: "var(--surface-400)" }} />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-6 py-6">
          <div className="readme-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="readme-h1">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="readme-h2">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="readme-h3">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="readme-p">{children}</p>
                ),
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="readme-a">
                    {children}
                  </a>
                ),
                code: ({ children, className }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="readme-code-inline">{children}</code>
                  ) : (
                    <pre className="readme-pre">
                      <code className={className}>{children}</code>
                    </pre>
                  );
                },
                pre: ({ children }) => <>{children}</>,
                ul: ({ children }) => <ul className="readme-ul">{children}</ul>,
                ol: ({ children }) => <ol className="readme-ol">{children}</ol>,
                li: ({ children }) => <li className="readme-li">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="readme-blockquote">{children}</blockquote>
                ),
                table: ({ children }) => (
                  <div className="readme-table-wrapper">
                    <table className="readme-table">{children}</table>
                  </div>
                ),
                img: ({ src, alt }) => (
                  <img src={src} alt={alt} className="readme-img" loading="lazy" />
                ),
                hr: () => <hr className="readme-hr" />,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
