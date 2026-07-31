// Pure timing helpers. MUST stay in sync with backend/app/utils/game_engine.py.
export const ANSWER_WINDOW_SECONDS = 10;
export const REVEAL_SECONDS = 3;
export const CYCLE_SECONDS = ANSWER_WINDOW_SECONDS + REVEAL_SECONDS; // 13
export const TOTAL_QUESTIONS = 10;
export const MATCH_SECONDS = CYCLE_SECONDS * TOTAL_QUESTIONS; // 130

export function elapsedSeconds(startedAtMs: number, pausedAtMs: number | null, nowMs: number): number {
  const ref = pausedAtMs ?? nowMs;
  return Math.max(0, Math.floor((ref - startedAtMs) / 1000));
}

export function questionIndex(elapsed: number): number {
  return Math.floor(elapsed / CYCLE_SECONDS);
}

export function matchEnded(elapsed: number): boolean {
  return elapsed >= MATCH_SECONDS;
}

export function secondsIntoCycle(elapsed: number): number {
  return elapsed % CYCLE_SECONDS;
}

export function isAnswerWindowOpen(elapsed: number): boolean {
  return secondsIntoCycle(elapsed) < ANSWER_WINDOW_SECONDS;
}

export function secondsLeftInWindow(elapsed: number): number {
  return Math.max(0, ANSWER_WINDOW_SECONDS - secondsIntoCycle(elapsed));
}

export function matchSecondsLeft(elapsed: number): number {
  return Math.max(0, MATCH_SECONDS - elapsed);
}
