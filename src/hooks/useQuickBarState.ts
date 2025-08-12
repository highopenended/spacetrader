import { useCallback, useMemo, useState } from 'react';
import { QuickBarFlags, QuickBarConfig } from '../types/quickBarState';

const initialFlags: QuickBarFlags = {
  dumpsterVisionEnabled: true,
};

export const useQuickBarState = () => {
  const [quickBarFlags, setQuickBarFlags] = useState<QuickBarFlags>(initialFlags);

  const setQuickBarFlag = useCallback((key: keyof QuickBarFlags, value: boolean) => {
    setQuickBarFlags(prev => ({ ...prev, [key]: value }));
  }, []);

  // Static config for quick keys
  const quickBarConfig: QuickBarConfig = useMemo(() => ({
    dumpsterVision: {
      id: 'dumpsterVision',
      label: 'Dumpster Vision',
      shortcutKey: 'X',
      showInQuickBar: true,
      toggleFlagKey: 'dumpsterVisionEnabled',
      requiresAppId: 'dumpsterVision',
    },
  }), []);

  return {
    quickBarFlags,
    setQuickBarFlag,
    quickBarConfig,
  };
};


