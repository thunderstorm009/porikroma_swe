import React from 'react';

function renderInline(text) {
  if (!text) return null;
  const parts = [];
  let key = 0;

  // Match bold **text**, italic *text*, code `text`
  const regex = /(\*\*(.*?)\*\*|\*(.*?)\*|`(.*?)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2] !== undefined) {
      parts.push(<strong key={key++} className="font-semibold text-navy">{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      parts.push(<em key={key++}>{match[3]}</em>);
    } else if (match[4] !== undefined) {
      parts.push(<code key={key++} className="bg-fog px-1.5 py-0.5 rounded text-xs font-mono">{match[4]}</code>);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export default function FormattedMarkdown({ content = '' }) {
  if (!content) return null;

  // Normalizing line breaks if text contains escaped \n or compact inline hyphens
  let normalized = content.replace(/\\n/g, '\n');

  // If inline bullets were glued together without newlines (e.g. "... recommendations? - **Destination..." )
  normalized = normalized.replace(/\s+-\s+\*\*/g, '\n- **');

  const lines = normalized.split('\n');
  const elements = [];
  let currentList = [];
  let currentListType = null;

  const flushList = () => {
    if (currentList.length > 0) {
      if (currentListType === 'ul') {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1.5 my-2 pl-2 text-navy/90">
            {currentList.map((item, idx) => (
              <li key={idx} className="leading-relaxed text-sm">{renderInline(item)}</li>
            ))}
          </ul>
        );
      } else if (currentListType === 'ol') {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-1.5 my-2 pl-2 text-navy/90">
            {currentList.map((item, idx) => (
              <li key={idx} className="leading-relaxed text-sm">{renderInline(item)}</li>
            ))}
          </ol>
        );
      }
      currentList = [];
      currentListType = null;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(<h4 key={index} className="text-base font-bold font-serif text-navy mt-3 mb-1">{renderInline(trimmed.replace(/^###\s+/, ''))}</h4>);
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(<h3 key={index} className="text-lg font-bold font-serif text-navy mt-4 mb-2">{renderInline(trimmed.replace(/^##\s+/, ''))}</h3>);
      return;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(<h2 key={index} className="text-xl font-bold font-serif text-navy mt-4 mb-2">{renderInline(trimmed.replace(/^#\s+/, ''))}</h2>);
      return;
    }

    // Unordered List Bullet (- or * or •)
    const ulMatch = trimmed.match(/^[-*•]\s+(.*)/);
    if (ulMatch) {
      if (currentListType && currentListType !== 'ul') flushList();
      currentListType = 'ul';
      currentList.push(ulMatch[1]);
      return;
    }

    // Ordered List Bullet (1. 2. etc)
    const olMatch = trimmed.match(/^\d+\.\s+(.*)/);
    if (olMatch) {
      if (currentListType && currentListType !== 'ol') flushList();
      currentListType = 'ol';
      currentList.push(olMatch[1]);
      return;
    }

    // Regular line / paragraph
    flushList();
    elements.push(
      <p key={index} className="my-1.5 leading-relaxed text-sm text-navy/90">
        {renderInline(trimmed)}
      </p>
    );
  });

  flushList();

  return <div className="formatted-markdown space-y-1 text-left">{elements}</div>;
}
