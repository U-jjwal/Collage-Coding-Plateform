import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Code2 } from 'lucide-react';
import { authService } from '../../services';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the URL.');
      return;
    }

    const verify = async () => {
      try {
        const { data } = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Code2 size={22} className="text-white" />
          </div>
        </div>

        <div className="card text-center">
          {status === 'verifying' && (
            <>
              <div className="w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
                <Loader2 size={32} className="text-violet-400 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Verifying your email...</h2>
              <p className="text-zinc-400 text-sm">Please wait a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Email verified!</h2>
              <p className="text-zinc-400 text-sm mb-6">{message}</p>
              <Link to="/login" className="btn-primary w-full justify-center">Continue to sign in</Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <XCircle size={32} className="text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Verification failed</h2>
              <p className="text-zinc-400 text-sm mb-6">{message}</p>
              <div className="flex flex-col gap-3">
                <Link to="/login" className="btn-secondary w-full justify-center">Back to sign in</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
