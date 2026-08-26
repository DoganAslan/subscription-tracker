import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SafeMarkdownTextProps {
  text: string;
  color: string;
  headingColor?: string;
  mutedColor?: string;
  variant?: 'chat' | 'document';
}

const inlinePattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
const bulletPattern = /^\s*([-•]|\d+[.)]|[1-9]️⃣)\s+/;
const headingPattern = /^(#{1,3})\s+(.+)$/;

function renderInlineText(line: string, color: string, mutedColor: string): React.ReactNode[] {
  return line.split(inlinePattern).filter(Boolean).map((part, index) => {
    const isBold = part.startsWith('**') && part.endsWith('**');
    const isItalic = !isBold && part.startsWith('*') && part.endsWith('*');
    const linkMatch = part.match(/^\[([^\]]+)]\([^)]+\)$/);
    const value = linkMatch?.[1] ?? (isBold ? part.slice(2, -2) : isItalic ? part.slice(1, -1) : part);
    return (
      <Text
        key={`${index}-${value.slice(0, 12)}`}
        style={[
          styles.inline,
          { color: isItalic ? mutedColor : color },
          isBold && styles.bold,
          isItalic && styles.italic,
          linkMatch && styles.linkLabel,
        ]}
      >
        {value}
      </Text>
    );
  });
}

/**
 * A deliberately small Markdown renderer. It supports headings, emphasis,
 * bullets and blockquotes, but never interprets URLs, HTML, images or plugins.
 */
export function SafeMarkdownText({
  text,
  color,
  headingColor = color,
  mutedColor = color,
  variant = 'chat',
}: SafeMarkdownTextProps) {
  const isDocument = variant === 'document';
  const lines = text.replace(/\r\n?/g, '\n').slice(0, 100_000).split('\n').slice(0, 2_000);

  return (
    <View style={styles.container}>
      {lines.map((rawLine, index) => {
        const line = rawLine.replace(/\s{2,}$/, '');
        if (!line.trim()) {
          return <View key={`space-${index}`} style={isDocument ? styles.documentSpacer : styles.chatSpacer} />;
        }

        const headingMatch = line.match(headingPattern);
        if (headingMatch) {
          const level = headingMatch[1].length;
          return (
            <Text
              key={`heading-${index}`}
              style={[
                styles.heading,
                level === 1 ? styles.headingOne : level === 2 ? styles.headingTwo : styles.headingThree,
                { color: headingColor },
              ]}
            >
              {renderInlineText(headingMatch[2], headingColor, mutedColor)}
            </Text>
          );
        }

        if (line.startsWith('>')) {
          const quote = line.replace(/^>\s?/, '');
          return (
            <View key={`quote-${index}`} style={styles.blockquote}>
              <Text style={[styles.documentLine, { color }]}>
                {renderInlineText(quote, color, mutedColor)}
              </Text>
            </View>
          );
        }

        const bulletMatch = line.match(bulletPattern);
        if (bulletMatch) {
          const content = line.slice(bulletMatch[0].length);
          const marker = /^[-•]$/.test(bulletMatch[1]) ? '•' : bulletMatch[1];
          return (
            <View key={`bullet-${index}`} style={styles.bulletRow}>
              <Text style={[isDocument ? styles.documentMarker : styles.chatMarker, { color }]}>{marker}</Text>
              <Text style={[isDocument ? styles.documentLine : styles.chatLine, styles.bulletContent, { color }]}>
                {renderInlineText(content, color, mutedColor)}
              </Text>
            </View>
          );
        }

        return (
          <Text
            key={`line-${index}`}
            style={[isDocument ? styles.documentLine : styles.chatLine, { color }]}
          >
            {renderInlineText(line, color, mutedColor)}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inline: {},
  chatLine: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 3,
  },
  documentLine: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 5,
  },
  bold: {
    fontWeight: '800',
  },
  italic: {
    fontStyle: 'italic',
  },
  linkLabel: {
    textDecorationLine: 'underline',
  },
  chatSpacer: {
    height: 5,
  },
  documentSpacer: {
    height: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  chatMarker: {
    width: 22,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  documentMarker: {
    width: 24,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '700',
  },
  bulletContent: {
    flex: 1,
  },
  heading: {
    fontWeight: '800',
  },
  headingOne: {
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 8,
  },
  headingTwo: {
    fontSize: 18,
    lineHeight: 25,
    marginTop: 14,
    marginBottom: 8,
  },
  headingThree: {
    fontSize: 16,
    lineHeight: 23,
    marginTop: 10,
    marginBottom: 6,
  },
  blockquote: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
  },
});
