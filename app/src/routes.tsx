import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import ExercisesListScreen from './features/exercises/ExercisesListScreen';
import ExerciseFormScreen from './features/exercises/ExerciseFormScreen';
import RoutinesListScreen from './features/routines/RoutinesListScreen';
import RoutineEditorScreen from './features/routines/RoutineEditorScreen';
import RoutineDetailScreen from './features/routines/RoutineDetailScreen';
import TrainScreen from './features/train/TrainScreen';
import HistoryListScreen from './features/history/HistoryListScreen';
import SessionDetailScreen from './features/history/SessionDetailScreen';
import BackupScreen from './features/backup/BackupScreen';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/train" replace /> },
      { path: 'train', element: <TrainScreen /> },
      { path: 'routines', element: <RoutinesListScreen /> },
      { path: 'routines/new', element: <RoutineEditorScreen /> },
      { path: 'routines/:id', element: <RoutineDetailScreen /> },
      { path: 'routines/:id/edit', element: <RoutineEditorScreen /> },
      { path: 'exercises', element: <ExercisesListScreen /> },
      { path: 'exercises/new', element: <ExerciseFormScreen /> },
      { path: 'exercises/:id/edit', element: <ExerciseFormScreen /> },
      { path: 'history', element: <HistoryListScreen /> },
      { path: 'history/:id', element: <SessionDetailScreen /> },
      { path: 'backup', element: <BackupScreen /> },
      { path: '*', element: <Navigate to="/train" replace /> },
    ],
  },
]);
