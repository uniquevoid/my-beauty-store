import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { adminChangePassword } from '../api/admin';
import { isAdminLoggedIn } from '../auth/adminSession';

export default function AdminChangePasswordPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isAdminLoggedIn()) {
    return <Navigate to="/admin/login" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirm) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await adminChangePassword(currentPassword, newPassword);
      navigate('/admin', { replace: true });
    } catch {
      setError('Could not change password. Check your current password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8">
      <h1 className="text-xl font-semibold">Change password</h1>
      <p className="mt-2 text-sm text-slate-600">You must set a new password before continuing.</p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm">
          Current password
          <input
            type="password"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          New password
          <input
            type="password"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Confirm new password
          <input
            type="password"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-brand-primary px-4 py-2 text-white"
        >
          {loading ? 'Saving…' : 'Save password'}
        </button>
      </form>
    </div>
  );
}
