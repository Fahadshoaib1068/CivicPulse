declare global {
  interface Window {
    CIVICPULSE_CONFIG?: {
      apiBaseUrl?: string;
    };
  }
}

export function getApiBaseUrl(): string {
  const runtimeUrl =
    typeof window !== 'undefined' ? window.CIVICPULSE_CONFIG?.apiBaseUrl : undefined;

  const envUrl = import.meta.env.VITE_API_BASE_URL;
  const defaultUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (runtimeUrl ?? envUrl ?? defaultUrl).replace(/\/+$/, '');
}
