import { useMemo } from 'react';
import katex from 'katex';

interface KatexFormulaProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

export function KatexFormula({
  latex,
  displayMode = false,
  className = '',
}: KatexFormulaProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return latex;
    }
  }, [latex, displayMode]);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
