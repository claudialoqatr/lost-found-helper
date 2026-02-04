import { vi } from "vitest";

// Chainable query builder mock
export const createQueryBuilder = (data: unknown = null, error: unknown = null) => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    then: vi.fn((resolve) => resolve({ data, error })),
  };
  return builder;
};

// Default mock responses
let mockQrCodeResponse: { data: unknown; error: unknown } = { data: null, error: null };
let mockUserResponse: { data: unknown; error: unknown } = { data: null, error: null };

export const setMockQrCodeResponse = (data: unknown, error: unknown = null) => {
  mockQrCodeResponse = { data, error };
};

export const setMockUserResponse = (data: unknown, error: unknown = null) => {
  mockUserResponse = { data, error };
};

export const resetMocks = () => {
  mockQrCodeResponse = { data: null, error: null };
  mockUserResponse = { data: null, error: null };
};

// Create a mock supabase client
export const createMockSupabaseClient = () => {
  return {
    from: vi.fn((table: string) => {
      if (table === "qrcodes") {
        return createQueryBuilder(mockQrCodeResponse.data, mockQrCodeResponse.error);
      }
      if (table === "users") {
        return createQueryBuilder(mockUserResponse.data, mockUserResponse.error);
      }
      return createQueryBuilder();
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  };
};

export const mockSupabase = createMockSupabaseClient();
