import { TextInput, ActionIcon, Group, Paper } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSendMessage: () => void;
  disabled: boolean;
}

export function ChatInput({ value, onChange, onSendMessage, disabled }: ChatInputProps) {
  return (
    <Paper bg="transparent" style={{ maxWidth: '800px', margin: '0 auto', width: '100%'}}>
      <Group>
        <TextInput
          style={{ flex: 1 }}
          placeholder="Type your message..."
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          onKeyPress={(event) => {
            if (event.key === 'Enter') {
              onSendMessage();
            }
          }}
          radius="xl"
          size="md"
          disabled={disabled}
        />
        <ActionIcon size="xl" onClick={onSendMessage} variant="filled" color="blue" radius="xl" disabled={disabled}>
          <IconSend size={22} />
        </ActionIcon>
      </Group>
    </Paper>
  );
}
