import { Popover, Text } from '@mantine/core';
import type { Source } from '../types';

interface CitationProps {
  sourceId: number;
  sources: Source[];
  onClick: () => void;
}

export function Citation({ sourceId, sources, onClick }: CitationProps) {
  const source = sources[sourceId];

  if (!source) {
    return <Text component="span"> (Source not found)</Text>;
  }

  return (
    <Popover width={400} withArrow shadow="md">
     
        <Text component="span" c="blue" fw={700} style={{ cursor: 'pointer' }} onClick={onClick}>
          [{sourceId + 1}]
        </Text>
    
  
    </Popover>
  );
}
