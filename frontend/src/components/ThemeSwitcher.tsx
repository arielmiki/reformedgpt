import { Group, Switch, useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';

export function ThemeSwitcher() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');

  return (
    <Group>
      <IconSun size={18} />
      <Switch
        checked={computedColorScheme === 'dark'}
        onChange={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
        size="md"
      />
      <IconMoon size={18} />
    </Group>
  );
}
