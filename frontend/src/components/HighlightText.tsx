interface HighlightTextProps {
  text: string;
  searchTerm: string;
}

export function HighlightText({ text, searchTerm }: HighlightTextProps) {
  if (!searchTerm || !text) {
    return <>{text}</>;
  }

  const parts = text.toString().split(new RegExp(`(${searchTerm})`, 'gi'));

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <mark
            key={index}
            style={{
              backgroundColor: '#FEF08A',
              color: 'var(--text-primary)',
              fontWeight: 700,
              padding: '2px 0',
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
}
