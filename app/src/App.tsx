import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import SettingsButton from './components/SettingsButton';
import UpdatePrompt from './components/UpdatePrompt';

const BOTTOM_NAV_HEIGHT = 56;

/**
 * Root layout: scrollable content area rendering the active route, a fixed
 * settings shortcut, the fixed bottom tab bar, and the update-available
 * banner. Content gets bottom padding (nav height + safe area) so the last
 * item in any list is never hidden behind the nav.
 */
function App() {
  const location = useLocation();

  return (
    <>
      <main
        className="flex-1 overflow-y-auto"
        style={{
          paddingBottom: `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom))`,
        }}
      >
        {location.pathname !== '/backup' && <SettingsButton />}
        <Outlet />
      </main>
      <UpdatePrompt />
      <BottomNav />
    </>
  );
}

export default App;
