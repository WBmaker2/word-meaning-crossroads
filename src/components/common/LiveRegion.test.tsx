import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LiveRegion } from './LiveRegion';

describe('LiveRegion', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders one visible error announcer', () => {
    const { container } = render(
      <LiveRegion tone="error" message="다시 단서를 살펴보세요" feedbackSequence={1} />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('다시 단서를 살펴보세요');
    expect(container.querySelectorAll('[data-feedback-announcer]')).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByRole('alert')).toHaveAttribute('aria-atomic', 'true');
  });

  it('re-announces the same message after a sequence change', () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <LiveRegion tone="status" message="잘 찾았어요" feedbackSequence={1} />,
    );

    rerender(<LiveRegion tone="status" message="잘 찾았어요" feedbackSequence={2} />);
    expect(screen.getByRole('status')).toHaveTextContent('');
    act(() => vi.runOnlyPendingTimers());
    expect(screen.getByRole('status')).toHaveTextContent('잘 찾았어요');
    vi.useRealTimers();
  });

  it('does not let an older animation frame restore stale feedback', () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <LiveRegion tone="status" message="첫 번째 안내" feedbackSequence={1} />,
    );

    rerender(<LiveRegion tone="status" message="두 번째 안내" feedbackSequence={2} />);
    rerender(<LiveRegion tone="status" message="최신 안내" feedbackSequence={3} />);
    expect(screen.getByRole('status')).toHaveTextContent('');

    act(() => vi.runOnlyPendingTimers());
    expect(screen.getByRole('status')).toHaveTextContent('최신 안내');
    expect(screen.getByRole('status')).not.toHaveTextContent('두 번째 안내');
    vi.useRealTimers();
  });
});
