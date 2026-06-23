import { Route, Routes } from 'react-router-dom';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PublicOnlyRoute from '@/components/auth/PublicOnlyRoute';

function App() {
  return (
    <div className="w-full min-h-dvh flex items-start justify-center bg-neutral-50 py-10">
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
