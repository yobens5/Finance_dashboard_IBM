// ─── App root ────────────────────────────────────────────────────────────────

import { AppShell } from './components/layout/AppShell';
import { TabBar } from './components/layout/TabBar';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { useMarketStore } from './store/marketSlice';

export default function App() {
  const activeWindow = useMarketStore((s) => s.activeWindow);
  const setWindow = useMarketStore((s) => s.setWindow);

  return (
    <AppShell>
      <TabBar active={activeWindow} onChange={setWindow} />
      <DashboardPage window={activeWindow} />
    </AppShell>
  );
}
