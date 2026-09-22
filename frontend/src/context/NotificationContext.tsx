import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';

type Severity = 'success' | 'error' | 'info' | 'warning';

interface NotificationContextValue {
  notify: (message: string, severity?: Severity) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// Module-level emitter so non-React code (e.g. the axios interceptor) can also trigger toasts
let emitFromOutsideReact: ((message: string, severity: Severity) => void) | null = null;
export function notifyGlobally(message: string, severity: Severity = 'error'): void {
  emitFromOutsideReact?.(message, severity);
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ message: string; severity: Severity } | null>(null);

  const notify = useCallback((message: string, severity: Severity = 'success') => {
    setState({ message, severity });
  }, []);

  emitFromOutsideReact = notify;

  const value = useMemo<NotificationContextValue>(() => ({ notify }), [notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={Boolean(state)}
        autoHideDuration={4000}
        onClose={() => setState(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {state ? (
          <Alert severity={state.severity} onClose={() => setState(null)} variant="filled" sx={{ minWidth: 260 }}>
            {state.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotification muss innerhalb eines NotificationProvider verwendet werden');
  }
  return ctx;
}
