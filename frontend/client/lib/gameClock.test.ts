import { describe, it, expect } from "vitest";
import * as clock from "./gameClock";

describe("gameClock", () => {
  it("constants match the backend", () => {
    expect(clock.CYCLE_SECONDS).toBe(clock.ANSWER_WINDOW_SECONDS + clock.REVEAL_SECONDS);
    expect(clock.TOTAL_QUESTIONS).toBe(10);
  });

  it("computes the current question index", () => {
    expect(clock.questionIndex(0)).toBe(0);
    expect(clock.questionIndex(12)).toBe(0);
    expect(clock.questionIndex(13)).toBe(1);
    expect(clock.questionIndex(129)).toBe(9);
  });

  it("detects match end", () => {
    expect(clock.matchEnded(129)).toBe(false);
    expect(clock.matchEnded(130)).toBe(true);
  });

  it("reports the answer window state", () => {
    expect(clock.isAnswerWindowOpen(13 + 4)).toBe(true);
    expect(clock.isAnswerWindowOpen(13 + 10)).toBe(false);
  });

  it("returns remaining seconds in the window", () => {
    expect(clock.secondsLeftInWindow(13 + 4)).toBe(6);
    expect(clock.secondsLeftInWindow(13 + 10)).toBe(0);
  });
});
