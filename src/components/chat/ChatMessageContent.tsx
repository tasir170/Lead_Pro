import React from 'react';

interface ChatMessageContentProps {
  content: string;
}

export const ChatMessageContent: React.FC<ChatMessageContentProps> = ({ content }) => {
  // Parse simple markdown blocks
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-800">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // H3 Header: ### Header
        if (line.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-base font-bold text-slate-900 mt-2 mb-1 flex items-center gap-1.5">
              {formatInlineStyles(line.replace('### ', ''))}
            </h3>
          );
        }

        // H4 Header: #### Header
        if (line.startsWith('#### ')) {
          return (
            <h4 key={idx} className="text-xs font-bold text-slate-800 uppercase tracking-wider mt-2 mb-1">
              {formatInlineStyles(line.replace('#### ', ''))}
            </h4>
          );
        }

        // Blockquote: > text
        if (line.startsWith('> ')) {
          return (
            <blockquote key={idx} className="border-l-3 border-blue-500 bg-blue-50/50 pl-3 py-1 my-1 text-slate-700 italic rounded-r text-xs">
              {formatInlineStyles(line.replace('> ', ''))}
            </blockquote>
          );
        }

        // Bullet list: - item or * item
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 text-xs ml-1 my-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
              <div className="flex-1">{formatInlineStyles(line.replace(/^[-*]\s+/, ''))}</div>
            </div>
          );
        }

        // Code block or snippet: ```text ... ```
        if (line.startsWith('```')) {
          return (
            <div key={idx} className="text-[11px] font-mono bg-slate-900 text-slate-200 px-3 py-2 rounded-lg my-1">
              {line.replace(/```[a-z]*/i, '')}
            </div>
          );
        }

        // Standard paragraph line
        return (
          <p key={idx} className="text-xs text-slate-700 leading-normal">
            {formatInlineStyles(line)}
          </p>
        );
      })}
    </div>
  );
};

// Helper for inline bold (**text**), italics (_text_), and code (`text`)
function formatInlineStyles(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Tokenize regex for **bold**, `code`, _italics_
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={match.index} className="px-1 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px]">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('_') && token.endsWith('_')) {
      parts.push(
        <em key={match.index} className="italic text-slate-600">
          {token.slice(1, -1)}
        </em>
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}
