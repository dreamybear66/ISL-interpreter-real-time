import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import SpeechInput from '../modules/interpreter-video/SpeechInput';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <div className="min-h-screen bg-isl-bg font-sans selection:bg-isl-primary/10">
        <main className="container mx-auto py-12 px-4">
          <SpeechInput />
        </main>
      </div>
    ),
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;
