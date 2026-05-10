"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";

interface ReadmeViewerProps {
  content: string;
  owner: string;
  repoName: string;
  defaultBranch?: string;
}

function isExternalUrl(url: string) {
  return /^(https?:)?\/\//.test(url) || url.startsWith("#") || url.startsWith("mailto:");
}

export function ReadmeViewer({
  content,
  owner,
  repoName,
  defaultBranch = "HEAD",
}: ReadmeViewerProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const resolveBlobUrl = (href?: string) => {
    if (!href || isExternalUrl(href)) return href;
    const normalized = href.replace(/^\.\//, "");
    return `https://github.com/${owner}/${repoName}/blob/${defaultBranch}/${normalized}`;
  };

  const resolveRawUrl = (src?: string) => {
    if (!src || isExternalUrl(src)) return src;
    const normalized = src.replace(/^\.\//, "");
    return `https://raw.githubusercontent.com/${owner}/${repoName}/${defaultBranch}/${normalized}`;
  };

  if (!content) {
    return (
      <div className="card flex flex-col items-center justify-center py-10 px-4">
        <FileText
          style={{ width: 32, height: 32, color: "var(--color-text-muted)" }}
          className="mb-2"
        />
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          暂无 README
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-5 py-3.5 text-left"
        style={{ borderBottom: isExpanded ? "1px solid var(--color-border)" : "none" }}
      >
        <div className="flex items-center gap-2">
          <FileText style={{ width: 16, height: 16, color: "var(--color-text-muted)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-heading)" }}>
            README.md
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp style={{ width: 16, height: 16, color: "var(--color-text-muted)" }} />
        ) : (
          <ChevronDown style={{ width: 16, height: 16, color: "var(--color-text-muted)" }} />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-6 py-6">
          <div className="readme-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="readme-h1">{children}</h1>,
                h2: ({ children }) => <h2 className="readme-h2">{children}</h2>,
                h3: ({ children }) => <h3 className="readme-h3">{children}</h3>,
                p: ({ children }) => <p className="readme-p">{children}</p>,
                a: ({ href, children }) => (
                  <a
                    href={resolveBlobUrl(href)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="readme-a"
                  >
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
                  <img
                    src={resolveRawUrl(typeof src === "string" ? src : undefined)}
                    alt={alt}
                    className="readme-img"
                    loading="lazy"
                  />
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
