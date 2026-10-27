import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest runs without globals, so Testing Library's auto-cleanup is not
// registered; unmount after every test so renders do not leak between tests.
afterEach(() => cleanup());
