
import { useMemo } from 'react';
import { getAppMode, getModeConfig } from '../utils';
import { UserProfile } from '../types';

export const useAppMode = (userProfile: UserProfile | null) => {
  const mode = useMemo(() => {
    return getAppMode(userProfile?.birthDate);
  }, [userProfile?.birthDate]);

  const config = useMemo(() => getModeConfig(mode), [mode]);

  return { mode, config, isExplorer: mode === 'EXPLORER' };
};
