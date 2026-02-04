import { vi } from "vitest";

// Track navigation calls for assertions
export const mockNavigate = vi.fn();

// Default mock values
let mockParams: Record<string, string> = {};
let mockSearchParams = new URLSearchParams();

export const setMockParams = (params: Record<string, string>) => {
  mockParams = params;
};

export const setMockSearchParams = (params: Record<string, string>) => {
  mockSearchParams = new URLSearchParams(params);
};

export const resetRouterMocks = () => {
  mockNavigate.mockClear();
  mockParams = {};
  mockSearchParams = new URLSearchParams();
};

// Mock implementations for react-router-dom hooks
export const mockUseNavigate = () => mockNavigate;

export const mockUseParams = () => mockParams;

export const mockUseSearchParams = () => [
  mockSearchParams,
  vi.fn((newParams: URLSearchParams) => {
    mockSearchParams = newParams;
  }),
];

export const mockUseLocation = () => ({
  pathname: "/",
  search: mockSearchParams.toString(),
  hash: "",
  state: null,
  key: "default",
});

// Helper to create router mock module
export const createRouterMock = () => ({
  useNavigate: mockUseNavigate,
  useParams: mockUseParams,
  useSearchParams: mockUseSearchParams,
  useLocation: mockUseLocation,
});
