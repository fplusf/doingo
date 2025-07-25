import ToggleTheme from '@/shared/components/toggle-theme';
import { render } from '@testing-library/react';
import { expect, test } from 'vitest';

test('renders ToggleTheme', () => {
  const { getByRole } = render(<ToggleTheme />);
  const isButton = getByRole('button');

  expect(isButton).toBeInTheDocument();
});

test('has icon', () => {
  const { getByRole } = render(<ToggleTheme />);
  const button = getByRole('button');
  const icon = button.querySelector('svg');

  expect(icon).toBeInTheDocument();
});

test('is moon icon', () => {
  const svgIconClassName: string = 'lucide-moon';
  const { getByRole } = render(<ToggleTheme />);
  const svg = getByRole('button').querySelector('svg');

  expect(svg?.classList).toContain(svgIconClassName);
});
