import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './index.css';
import { seedDefaultExercisesIfEmpty } from './db/seed';
import { requestPersistentStorage } from './lib/persist';
import { router } from './routes';

// Fire-and-forget: don't block first render on either of these. Dexie's
// live queries pick up the seeded exercises reactively once they land.
void seedDefaultExercisesIfEmpty();
requestPersistentStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
