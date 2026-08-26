import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App shell', () => {
  it('provides the accessible classroom shell landmarks and controls', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: '낱말 뜻 갈림길' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '본문으로 건너뛰기' })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(screen.getByRole('button', { name: '업데이트 내역' })).toBeInTheDocument();
  });
});
