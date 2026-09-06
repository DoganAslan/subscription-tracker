import { useDiagnosticsStore } from '@/store/useDiagnosticsStore';

describe('diagnostics preference', () => {
  beforeEach(() => {
    useDiagnosticsStore.setState({
      isDiagnosticsEnabled: false,
      hasHydrated: false,
    });
  });

  it('defaults to disabled until the user explicitly opts in', () => {
    expect(useDiagnosticsStore.getState().isDiagnosticsEnabled).toBe(false);
  });

  it('updates the user preference without changing unrelated security state', () => {
    useDiagnosticsStore.getState().setDiagnosticsEnabled(true);

    expect(useDiagnosticsStore.getState().isDiagnosticsEnabled).toBe(true);
  });

  it('tracks persistence hydration separately from the preference', () => {
    useDiagnosticsStore.getState().setHasHydrated(true);

    expect(useDiagnosticsStore.getState().hasHydrated).toBe(true);
    expect(useDiagnosticsStore.getState().isDiagnosticsEnabled).toBe(false);
  });
});
