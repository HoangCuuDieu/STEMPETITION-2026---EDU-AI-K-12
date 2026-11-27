import { KatexFormula } from './KatexFormula';

function renderInlineTokens(
  text: string,
  isUser: boolean,
  allowBold: boolean,
): React.ReactNode[] {
  const pattern = allowBold
    ? /(\$\$[^$]+\$\$|\$[^$\n]+\$|\*\*[^*]+\*\*|`[^`]+`)/g
    : /(\$[^$\n]+\$|`[^`]+`)/g;
  const tokens = text.split(pattern);
  return tokens.map((part, idx) => {
    if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
      return (
        <div key={idx} className="my-1.5 overflow-x-auto">
          <KatexFormula latex={part.slice(2, -2)} displayMode />
        </div>
      );
    }
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      return (
        <span key={idx} className="inline-block align-middle mx-0.5">
          <KatexFormula latex={part.slice(1, -1)} />
        </span>
      );
    }
    if (allowBold && part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong
          key={idx}
          className={isUser ? 'font-extrabold text-white' : 'font-bold text-slate-950'}
        >
          {renderInlineTokens(part.slice(2, -2), isUser, false)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className={
            isUser
              ? 'px-1.5 py-0.5 rounded bg-white/20 font-mono text-[12px] text-white'
              : 'px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200/70 font-mono text-[12px] text-indigo-900'
          }
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export function RichMathText({ text, isUser = false }: { text: string; isUser?: boolean }) {
  return <>{renderInlineTokens(text, isUser, true)}</>;
}

