import { accountApi } from '@/lib/api/account';
import { ApiError, onUnauthorized, setAuthToken } from '@/lib/api/client';
import type { Account, Session } from '@/lib/api/types';
import { queryClient } from '@/lib/query-client';
import { tokenStorage } from '@/lib/token-storage';
import * as React from 'react';

type SessionState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; user: Account }
  | { status: 'offline'; message: string };

type SessionContextValue = {
  state: SessionState;
  user: Account | null;
  signIn: (session: Session) => Promise<void>;
  setUser: (user: Account) => void;
  signOut: () => Promise<void>;
  restore: () => Promise<void>;
};

const SessionContext = React.createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<SessionState>({ status: 'loading' });

  const signOut = React.useCallback(async () => {
    setAuthToken(null);
    await tokenStorage.clear();
    queryClient.clear();
    setState({ status: 'signedOut' });
  }, []);

  // Reads the saved token on launch so a logged-in user stays logged in after a restart.
  const restore = React.useCallback(async () => {
    setState({ status: 'loading' });
    const token = await tokenStorage.get();
    if (!token) return setState({ status: 'signedOut' });

    setAuthToken(token);
    try {
      const { user } = await accountApi.me();
      setState({ status: 'signedIn', user });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return signOut();
      const message =
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
      setState({ status: 'offline', message });
    }
  }, [signOut]);

  React.useEffect(() => {
    onUnauthorized(() => void signOut());
    void restore();
  }, [restore, signOut]);

  const value = React.useMemo<SessionContextValue>(
    () => ({
      state,
      user: state.status === 'signedIn' ? state.user : null,
      signIn: async ({ token, user }) => {
        await tokenStorage.set(token);
        setAuthToken(token);
        setState({ status: 'signedIn', user });
      },
      setUser: (user) => setState({ status: 'signedIn', user }),
      signOut,
      restore,
    }),
    [state, signOut, restore]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = React.useContext(SessionContext);
  if (!context) throw new Error('useSession must be used inside SessionProvider');
  return context;
}

// Keeps the last user so a signed-in screen can finish rendering while logout unmounts it.
export function useSignedInUser() {
  const { user } = useSession();
  const lastUser = React.useRef(user);
  if (user) lastUser.current = user;
  if (!lastUser.current) throw new Error('This screen needs a signed-in user');
  return lastUser.current;
}
