import { useLocation } from 'react-router-dom';
import { useCallback } from 'react';
import { useChunk } from 'stunk/react';

import { appChunk } from '@/lib/store/app-store';

export const useRouteAwareStateManager = () => {
  const location = useLocation();
  const [appState, setAppState] = useChunk(appChunk);

  const isRiderRoute = location.pathname.includes('/rider');

  const updateStateConditionally = useCallback((stateId: string, cityId: string = '') => {
    if (!isRiderRoute) {
      setAppState((prev) => ({
        ...prev,
        stateId,
        cityId,
      }));
    }
  }, [isRiderRoute, setAppState]);

  return {
    isRiderRoute,
    updateStateConditionally,
    appState,
    setAppState
  };
};
