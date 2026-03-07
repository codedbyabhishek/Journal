'use client';

import { useEffect } from 'react';

const RELOAD_FLAG = 'td-chunk-reload-once';

function isChunkErrorMessage(message: string): boolean {
  const text = message.toLowerCase();
  return (
    text.includes('loading chunk') ||
    text.includes('chunkloaderror') ||
    text.includes('failed to fetch dynamically imported module') ||
    text.includes('failed to load module script') ||
    text.includes('failed to load chunk')
  );
}

function recoverFromChunkError() {
  if (typeof window === 'undefined') return;

  const alreadyReloaded = window.sessionStorage.getItem(RELOAD_FLAG) === '1';
  if (alreadyReloaded) return;

  window.sessionStorage.setItem(RELOAD_FLAG, '1');
  window.location.reload();
}

export function ChunkRecovery() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const message = event.message || event.error?.message || '';
      if (isChunkErrorMessage(message)) {
        recoverFromChunkError();
      }
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = typeof reason === 'string' ? reason : reason?.message || '';
      if (isChunkErrorMessage(message)) {
        recoverFromChunkError();
      }
    };

    const clearTimer = window.setTimeout(() => {
      window.sessionStorage.removeItem(RELOAD_FLAG);
    }, 10000);

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      window.clearTimeout(clearTimer);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
