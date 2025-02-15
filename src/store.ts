import { isBrowser } from '$util.svelte';
import { writable, type Subscriber, type Writable } from 'svelte/store';

// Track and updates the current URL. Provides a `once` helper to subscribe and
// immediately unsubscribe, for the common case of responding to the fragment on
// load but not tracking it afterwards. Ignored in SSR mode.
// TODO reuse this elsewhere, currently only photos
export const url: Omit<Writable<string>, 'update'> & {
  once: (run: Subscriber<string>) => void;
} = (() => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  if (!isBrowser) return { ...writable<string>(''), once: () => {} };

  const { subscribe, set } = writable<string>('', (set) => {
    const updateValue = () => set(document.location.hash.slice(1));
    updateValue();
    addEventListener('hashchange', updateValue);
    return () => removeEventListener('hashchange', updateValue);
  });

  return {
    once: (run: Subscriber<string>) => subscribe(run)(),
    subscribe,
    set: (value: string) => {
      set(value);
      const oldUrl = new URL(document.location.href);
      const newUrl = new URL(value, oldUrl);
      // TODO: consider pushState instead if I want back/forward
      if (oldUrl.href != newUrl.href) history.replaceState({}, '', newUrl);
    },
  };
})();
