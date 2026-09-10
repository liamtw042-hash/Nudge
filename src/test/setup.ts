import '@testing-library/jest-dom/vitest';

import { setRepo } from '@/data';
import { LocalRepo } from '@/data/localRepo';

beforeEach(() => {
  localStorage.clear();
  setRepo(new LocalRepo());
});
