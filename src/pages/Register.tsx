import { SignUp } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import logoV1 from '/logo-v1.png';

export default function Register() {
  const _navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logoV1} alt="CoupleSync" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="gradient-heading text-4xl font-bold">CoupleSync</h1>
          <p className="text-muted mt-2">Start syncing your lives</p>
        </div>
        <div className="bg-white rounded-card shadow-card p-6">
          <SignUp
            routing="hash"
            signInUrl="/login"
            afterSignUpUrl="/dashboard"
            appearance={{
              elements: {
                card: { boxShadow: 'none', padding: '0' },
                headerTitle: { fontFamily: 'Playfair Display, serif', color: '#333' },
                headerSubtitle: { color: '#8E8E8E' },
                formButtonPrimary: {
                  background: '#D8829D',
                  borderRadius: '12px',
                  minHeight: '44px',
                  '&:hover': { opacity: '0.9' },
                },
                footerActionLink: { color: '#D8829D' },
                formFieldInput: {
                  borderRadius: '8px',
                  border: '1px solid #E0E0E0',
                  padding: '12px 16px',
                },
              },
            }}
          />
        </div>
        {/* Couple code input will be added after sign-up via custom flow */}
        <p className="text-center text-xs text-muted mt-4">
          After signing up, go to Dashboard to create or join a couple.
        </p>
      </div>
    </div>
  );
}