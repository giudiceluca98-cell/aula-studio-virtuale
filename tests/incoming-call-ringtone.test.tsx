import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useIncomingCallRingtone } from "@/hooks/use-incoming-call-ringtone";

class MockAudioParam {
  setValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}

class MockOscillator {
  type: OscillatorType = "sine";
  frequency = new MockAudioParam();
  onended: (() => void) | null = null;
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockGain {
  gain = new MockAudioParam();
  connect = vi.fn();
}

class MockAudioContext {
  static initialState: AudioContextState = "running";
  static instances: MockAudioContext[] = [];

  state: AudioContextState = MockAudioContext.initialState;
  currentTime = 10;
  destination = {} as AudioDestinationNode;
  oscillators: MockOscillator[] = [];
  resume = vi.fn(async () => undefined);
  close = vi.fn(async () => { this.state = "closed"; });
  createGain = vi.fn(() => new MockGain() as unknown as GainNode);
  createOscillator = vi.fn(() => {
    const oscillator = new MockOscillator();
    this.oscillators.push(oscillator);
    return oscillator as unknown as OscillatorNode;
  });

  constructor() { MockAudioContext.instances.push(this); }
}

describe("suoneria delle chiamate in arrivo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockAudioContext.initialState = "running";
    MockAudioContext.instances = [];
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      value: MockAudioContext,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("non produce suoni per chi non sta ricevendo una chiamata", () => {
    const { unmount } = renderHook(() => useIncomingCallRingtone(false));
    expect(MockAudioContext.instances).toHaveLength(0);
    unmount();
  });

  it("ripete il doppio squillo e si arresta quando l’invito termina", async () => {
    const { rerender, unmount } = renderHook(({ ringing }) => useIncomingCallRingtone(ringing), {
      initialProps: { ringing: true },
    });
    await act(async () => Promise.resolve());

    const context = MockAudioContext.instances[0];
    expect(context.oscillators).toHaveLength(4);
    act(() => { vi.advanceTimersByTime(2_200); });
    expect(context.oscillators).toHaveLength(8);

    rerender({ ringing: false });
    act(() => { vi.advanceTimersByTime(4_400); });
    expect(context.oscillators).toHaveLength(8);
    expect(context.oscillators.every((oscillator) => oscillator.stop.mock.calls.length >= 2)).toBe(true);
    unmount();
  });

  it("riprova dopo un gesto dell’utente quando l’audio automatico è bloccato", async () => {
    MockAudioContext.initialState = "suspended";
    const { unmount } = renderHook(() => useIncomingCallRingtone(true));
    await act(async () => Promise.resolve());
    const context = MockAudioContext.instances[0];
    expect(context.oscillators).toHaveLength(0);

    context.state = "running";
    await act(async () => {
      window.dispatchEvent(new Event("pointerdown"));
      await Promise.resolve();
    });
    expect(context.oscillators).toHaveLength(4);
    unmount();
  });
});
