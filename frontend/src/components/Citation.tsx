import { Text } from '@mantine/core';
import type { Source } from '../types';

interface CitationProps {
  sourceId: number;
  sources: Source[];
  onClick: () => void;
}

export function Citation({ sourceId, sources, onClick }: CitationProps) {
  const source = sources[sourceId];

  if (!source) {
    return <Text component="sup" mx={2}>[?]</Text>;
  }

  return (
    <Text
      component="sup"
      c="blue"
      fw={700}
      mx={2}
      style={{ cursor: 'pointer', display: 'inline' }}
      onClick={onClick}
    >
      [{sourceId + 1}]
    </Text>
  );
}
