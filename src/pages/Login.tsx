import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { captains } from '@/data/mockData';
import { Ship, Anchor, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const captain = captains.find(c => c.email === email && c.password === password);
    if (captain) {
      localStorage.setItem('voyageguard_captain', JSON.stringify(captain));
      navigate('/fleet');
    } else {
      setError('Invalid credentials. Use a demo account below.');
    }
  };

  const loginAs = (captain: typeof captains[0]) => {
    localStorage.setItem('voyageguard_captain', JSON.stringify(captain));
    navigate('/fleet');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Anchor className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Captain Voyage</h1>
          <p className="text-muted-foreground mt-1">Captain Bidding Interface</p>
        </div>

        <div className="glass-panel rounded-xl p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="captain@voyageguard.com"
                className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Sign In
            </button>
          </form>
        </div>

        <div className="mt-6">
          <p className="text-center text-muted-foreground text-xs uppercase tracking-wider mb-3">Demo Accounts</p>
          <div className="space-y-2">
            {captains.map(captain => (
              <button
                key={captain.id}
                onClick={() => loginAs(captain)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/40 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <Ship className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium text-foreground">{captain.name}</p>
                  <p className="text-xs text-muted-foreground">{captain.shipType} • {captain.shipName}</p>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{captain.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
