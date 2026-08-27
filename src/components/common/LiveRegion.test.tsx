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

  it('ignores a canceled stale frame while accepting the newest frame', () => {
    let nextFrameId = 0;
    const callbacks = new Map<number, FrameRequestCallback>();
    const canceledFrameIds: number[] = [];
    const requestFrame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      const frameId = ++nextFrameId;
      callbacks.set(frameId, callback);
      return frameId;
    });
    const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((frameId) => {
      canceledFrameIds.push(frameId);
    });

    try {
      const { rerender } = render(
        <LiveRegion tone="status" message="첫 번째 안내" feedbackSequence={1} />,
      );

      rerender(<LiveRegion tone="status" message="두 번째 안내" feedbackSequence={2} />);
      const staleFrameId = nextFrameId;
      rerender(<LiveRegion tone="status" message="최신 안내" feedbackSequence={3} />);
      const currentFrameId = nextFrameId;
      expect(canceledFrameIds).toContain(staleFrameId);
      expect(screen.getByRole('status')).toHaveTextContent('');

      act(() => {
        callbacks.get(staleFrameId)?.(0);
        callbacks.get(currentFrameId)?.(0);
      });
      expect(screen.getByRole('status')).toHaveTextContent('최신 안내');
      expect(screen.getByRole('status')).not.toHaveTextContent('두 번째 안내');
    } finally {
      requestFrame.mockRestore();
      cancelFrame.mockRestore();
    }
  });
});
