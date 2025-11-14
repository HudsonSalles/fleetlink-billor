// Test setup file
import '@testing-library/jest-dom';

// Mock Firebase
jest.mock('./config/firebase', () => ({
  db: {},
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
  },
  storage: {},
}));

// Mock Mapbox GL
Object.defineProperty(window, 'mapboxgl', {
  value: {
    Map: jest.fn(() => ({
      on: jest.fn(),
      off: jest.fn(),
      remove: jest.fn(),
      addSource: jest.fn(),
      addLayer: jest.fn(),
      removeLayer: jest.fn(),
      removeSource: jest.fn(),
    })),
    NavigationControl: jest.fn(),
    Marker: jest.fn(() => ({
      setLngLat: jest.fn(),
      addTo: jest.fn(),
      remove: jest.fn(),
    })),
  },
});

// Mock IntersectionObserver
interface MockIntersectionObserver {
  root?: Element | Document | null;
  rootMargin?: string;
  thresholds?: ReadonlyArray<number>;
  takeRecords(): IntersectionObserverEntry[];
}

global.IntersectionObserver = class IntersectionObserver implements MockIntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(
    public callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit
  ) {}

  observe(target: Element): void {
    return;
  }

  disconnect(): void {
    return;
  }

  unobserve(target: Element): void {
    return;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
};

// Mock ResizeObserver
interface MockResizeObserver {
  disconnect(): void;
  observe(target: Element, options?: ResizeObserverOptions): void;
  unobserve(target: Element): void;
}

global.ResizeObserver = class ResizeObserver implements MockResizeObserver {
  constructor(public callback: ResizeObserverCallback) {}

  observe(target: Element): void {
    return;
  }

  disconnect(): void {
    return;
  }

  unobserve(target: Element): void {
    return;
  }
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock matchMedia
// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' ? false : false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock window.location
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    href: 'http://localhost:3000/',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    origin: 'http://localhost:3000',
    assign: () => {},
    replace: () => {},
    reload: () => {},
  },
});