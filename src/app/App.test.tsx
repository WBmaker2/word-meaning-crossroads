import { cleanup, render, screen, within } from '@testing-library/react';
import { StrictMode } from 'react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { WORD_PACKS } from '../content/wordPacks';
import { FocusHeading } from '../components/common/FocusHeading';
import { ProgressHeader } from '../components/common/ProgressHeader';
import { RequiredActionButton } from '../components/common/RequiredActionButton';
import { UpdateHistoryDialog } from '../components/common/UpdateHistoryDialog';
import App from './App';

const firstScene = WORD_PACKS.find((pack) => pack.id === 'nun')!.scenes.find((scene) => scene.order === 1)!;

describe('App shell', () => {
  afterEach(() => cleanup());

  it('provides the accessible classroom shell landmarks and controls', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: '낱말 뜻 갈림길' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '본문으로 건너뛰기' })).toHaveAttribute(
      'href',
      '#main-content',
    );
    const historyTrigger = screen.getByRole('button', { name: '업데이트 내역' });
    expect(historyTrigger).toBeInTheDocument();
    expect(historyTrigger).not.toHaveFocus();
  });

  it('offers labelled text scale and line spacing radio groups without browser storage', async () => {
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    const user = userEvent.setup();
    render(<App />);

    const textScale = screen.getByRole('radiogroup', { name: '글자 크기' });
    const lineSpacing = screen.getByRole('radiogroup', { name: '줄 간격' });
    expect(within(textScale).getByRole('radio', { name: '보통' })).toBeChecked();
    expect(within(lineSpacing).getByRole('radio', { name: '보통' })).toBeChecked();
    expect(within(textScale).getByRole('radio', { name: '보통' })).toHaveAttribute('value', 'normal');
    expect(within(lineSpacing).getByRole('radio', { name: '보통' })).toHaveAttribute('value', 'comfortable');
    expect(document.querySelector('.app-shell')).toHaveStyle({ '--text-scale': '1', '--line-spacing': '1.65' });

    await user.click(within(textScale).getByRole('radio', { name: '아주 크게' }));
    await user.click(within(lineSpacing).getByRole('radio', { name: '넓게' }));
    expect(document.querySelector('.app-shell')).toHaveAttribute('data-text-scale', 'xlarge');
    expect(document.querySelector('.app-shell')).toHaveAttribute('data-line-spacing', 'wide');
    expect(document.querySelector('.app-shell')).toHaveStyle({ '--text-scale': '1.5', '--line-spacing': '1.9' });
    expect(within(textScale).getByRole('radio', { name: '아주 크게' })).toBeChecked();
    expect(within(lineSpacing).getByRole('radio', { name: '넓게' })).toBeChecked();
    expect(storageSpy).not.toHaveBeenCalled();
    storageSpy.mockRestore();
  });

  it('opens and closes update history while restoring trigger focus', async () => {
    const user = userEvent.setup();
    render(<App />);
    const trigger = screen.getByRole('button', { name: '업데이트 내역' });

    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: '업데이트 내역' });
    expect(trigger).toHaveClass('update-history-trigger');
    expect(trigger).not.toHaveClass('history-button');
    expect(trigger).not.toHaveAttribute('style');
    expect((await axe(dialog)).violations).toHaveLength(0);
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(5);
    expect(within(dialog).getAllByRole('listitem')[0]).toHaveTextContent('2026-08-26');
    expect(within(dialog).getAllByRole('listitem')[0]).toHaveTextContent('설계');
    expect(within(dialog).getAllByRole('listitem')[0]).toHaveTextContent('최초 설계 문서 작성');
    expect(within(dialog).getByText('2026-08-26')).toBeInTheDocument();
    expect(within(dialog).getByText('설계')).toBeInTheDocument();
    expect(within(dialog).getByText('최초 설계 문서 작성')).toBeInTheDocument();
    expect(within(dialog).getAllByText('2026-08-27')).toHaveLength(4);
    expect(within(dialog).getByText(/모바일 화면과 200% 글자 크기/)).toBeInTheDocument();
    expect(within(dialog).getByText(/키보드만으로 학습 흐름/)).toBeInTheDocument();
    expect(within(dialog).getByText(/스크린 리더 의미 구조와 단일 판정 알림/)).toBeInTheDocument();
    expect(within(dialog).getByText(/뜻을 고르기 전 화면의 내부 식별자/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/개발 완료|구현 완료/)).not.toBeInTheDocument();
    expect(document.querySelector('.app-shell')).toHaveAttribute('inert', '');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.querySelector('.app-shell')).not.toHaveAttribute('inert');

    await user.click(trigger);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '닫기' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('keeps one feedback announcer and maps feedback tone to its accessible role', () => {
    render(<App />);
    const announcers = document.querySelectorAll('[data-feedback-announcer]');
    expect(announcers).toHaveLength(1);
    expect(announcers[0]).toHaveAttribute('role', 'status');
    expect(announcers[0]).toHaveAttribute('aria-live', 'polite');
    expect(announcers[0]).toHaveAttribute('aria-atomic', 'true');
  });

  it('renders the constrained required action with its required emphasis', () => {
    render(<RequiredActionButton label="단서 찾기" />);
    const required = screen.getByRole('button', { name: /단서 찾기.*필수/ });
    expect(required).toHaveAttribute('type', 'button');
    expect(required).toHaveClass('gi-pulse');
    expect(required).toHaveAttribute('data-emphasis', 'gi-pulse');
    expect(document.querySelectorAll('.gi-pulse')).toHaveLength(1);
  });

  it('rejects a type-bypassed required action label', () => {
    expect(() =>
      render(<RequiredActionButton label={'다음 단계' as '단서 찾기'} />),
    ).toThrowError('Invalid RequiredActionButton label: 다음 단계');
    expect(screen.queryByRole('button', { name: /다음 단계/ })).not.toBeInTheDocument();
  });

  it('does not steal initial focus for the update-history trigger', () => {
    render(<UpdateHistoryDialog />);
    expect(screen.getByRole('button', { name: '업데이트 내역' })).not.toHaveFocus();
  });

  it('traps Tab focus inside the open update history dialog', async () => {
    const user = userEvent.setup();
    render(<UpdateHistoryDialog />);
    await user.click(screen.getByRole('button', { name: '업데이트 내역' }));
    const dialog = screen.getByRole('dialog', { name: '업데이트 내역' });
    const closeButton = within(dialog).getByRole('button', { name: '닫기' });

    expect(closeButton).toHaveFocus();
    await user.tab();
    expect(closeButton).toHaveFocus();
    await user.tab({ shift: true });
    expect(closeButton).toHaveFocus();
  });

  it('restores the update-history background attributes exactly', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <div className="app-shell">
        <UpdateHistoryDialog />
      </div>,
    );
    const background = container.firstElementChild as HTMLElement;
    background.setAttribute('aria-hidden', 'false');
    background.setAttribute('inert', 'until-found');

    await user.click(screen.getByRole('button', { name: '업데이트 내역' }));
    expect(background).toHaveAttribute('aria-hidden', 'true');
    expect(background).toHaveAttribute('inert', '');

    await user.keyboard('{Escape}');
    expect(background).toHaveAttribute('aria-hidden', 'false');
    expect(background).toHaveAttribute('inert', 'until-found');
  });

  it('focuses a changed heading key, but not a rerender with the same key', () => {
    const { rerender } = render(
      <FocusHeading level={2} focusKey="first">
        현재 단계
      </FocusHeading>,
    );
    const heading = screen.getByRole('heading', { level: 2, name: '현재 단계' });
    expect(heading).toHaveAttribute('tabindex', '-1');
    expect(heading).not.toHaveFocus();
    heading.blur();
    rerender(
      <FocusHeading level={2} focusKey="first">
        현재 단계
      </FocusHeading>,
    );
    expect(heading).not.toHaveFocus();
    rerender(
      <FocusHeading level={2} focusKey="second">
        다음 단계
      </FocusHeading>,
    );
    expect(screen.getByRole('heading', { level: 2, name: '다음 단계' })).toHaveFocus();
  });

  it('focuses an opt-in heading on mount without changing the default contract', () => {
    render(
      <FocusHeading level={2} focusKey="first" focusOnMount>
        새 단계
      </FocusHeading>,
    );
    expect(screen.getByRole('heading', { level: 2, name: '새 단계' })).toHaveFocus();
  });

  it('does not focus on StrictMode effect replay, but focuses on an actual key change', () => {
    const { rerender } = render(
      <StrictMode>
        <FocusHeading level={2} focusKey="first">
          현재 단계
        </FocusHeading>
      </StrictMode>,
    );
    const heading = screen.getByRole('heading', { level: 2, name: '현재 단계' });
    expect(heading).not.toHaveFocus();
    rerender(
      <StrictMode>
        <FocusHeading level={2} focusKey="first">
          현재 단계
        </FocusHeading>
      </StrictMode>,
    );
    expect(heading).not.toHaveFocus();
    rerender(
      <StrictMode>
        <FocusHeading level={2} focusKey="second">
          다음 단계
        </FocusHeading>
      </StrictMode>,
    );
    expect(screen.getByRole('heading', { level: 2, name: '다음 단계' })).toHaveFocus();
  });

  it('renders word and scene position in ProgressHeader', () => {
    const { rerender } = render(
      <ProgressHeader currentWordIndex={1} totalWords={4} currentSceneIndex={2} totalScenes={3} />,
    );
    const progress = screen.getByRole('group', { name: '현재 낱말 1/4 · 장면 2/3' });
    expect(progress).toHaveTextContent('현재 낱말 1/4 · 장면 2/3');
    expect(screen.queryByText(/%|점수|등급|남은 시간|타이머/)).not.toBeInTheDocument();
    rerender(
      <ProgressHeader currentWordIndex={0} totalWords={0} currentSceneIndex={0} totalScenes={0} />,
    );
    expect(screen.queryByText(/현재 낱말/)).not.toBeInTheDocument();
  });

  it('shows the second scene instead of repeating word-only progress', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '기본 길 4개' }));
    await user.type(screen.getByRole('textbox', { name: /처음에는 어떤 뜻/ }), '하늘에서 오는 것');
    await user.click(screen.getByRole('button', { name: /단서 찾기/ }));
    const decisiveId = firstScene.decisiveCueTokenIds[0];
    const decisive = firstScene.sentences[0].tokens.find((token) => token.id === decisiveId)!;
    await user.click(screen.getByRole('button', { name: new RegExp(decisive.text) }));
    await user.click(screen.getByRole('button', { name: /뜻 확인/ }));
    await user.click(screen.getByRole('radio', { name: /내리는 눈/ }));
    await user.click(screen.getByRole('button', { name: '선택한 뜻 결정하기' }));
    expect(screen.getByRole('group', { name: '현재 낱말 1/4 · 장면 2/3' })).toHaveTextContent('장면 2/3');
    expect(screen.queryByText('현재 낱말 1/4')).not.toBeInTheDocument();
  });
});
