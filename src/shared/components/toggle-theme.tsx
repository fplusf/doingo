import { Button } from '@/shared/components/ui/button';
import { toggleTheme } from '@/shared/helpers/theme_helpers';
import { Moon } from 'lucide-react';

export default function ToggleTheme() {
  return (
    <Button onClick={toggleTheme} size="icon">
      <Moon size={16} />
    </Button>
  );
}
