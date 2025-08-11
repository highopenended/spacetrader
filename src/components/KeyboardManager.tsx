import React from 'react';
import { InstalledApp } from '../types/scrAppListState';
import { ToggleStates } from '../types/toggleState';
import { APP_REGISTRY } from '../constants/scrAppListConstants';

interface KeyboardManagerProps {
  installedApps: InstalledApp[];
  toggleStates: ToggleStates;
  setToggleState: (key: keyof ToggleStates, value: boolean) => void;
}

const KeyboardManager: React.FC<KeyboardManagerProps> = ({ installedApps, toggleStates, setToggleState }) => {
  React.useEffect(() => {
    // Build a quick lookup of key -> toggleKey for installed apps
    const keyToToggleKey = new Map<string, keyof ToggleStates>();

    installedApps.forEach(app => {
      const def = APP_REGISTRY[app.id];
      if (!def || !def.showInQuickBar || !def.shortcutKey || !def.quickToggleStateKey) return;
      const key = String(def.shortcutKey).toUpperCase();
      keyToToggleKey.set(key, def.quickToggleStateKey);
    });

    const shouldIgnoreTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      if (target.isContentEditable) return true;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (shouldIgnoreTarget(e.target)) return;

      const pressed = e.key.toUpperCase();
      const toggleKey = keyToToggleKey.get(pressed);
      if (!toggleKey) return;

      const current = Boolean(toggleStates[toggleKey]);
      setToggleState(toggleKey, !current);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [installedApps, toggleStates, setToggleState]);

  return null;
};

export default KeyboardManager;


