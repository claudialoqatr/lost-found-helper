import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

// Create mock navigate function
const mockNavigate = vi.fn();

// Create mock params
let mockCode: string | undefined = "ABC123";
let mockSearchParams = new URLSearchParams();

// Mock react-router-dom before any imports
vi.mock("react-router-dom", () => ({
  useParams: () => ({ code: mockCode }),
  useSearchParams: () => [mockSearchParams, vi.fn()],
  useNavigate: () => mockNavigate,
}));

// Mock auth user state
let mockAuthUser: { id: string } | null = null;
let mockAuthLoading = false;

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: mockAuthUser,
    loading: mockAuthLoading,
  }),
}));

// Mock Supabase responses
let mockQrData: unknown = null;
let mockUserData: unknown = null;

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockImplementation(async () => {
        if (table === "qrcodes") {
          return { data: mockQrData, error: null };
        }
        if (table === "users") {
          return { data: mockUserData, error: null };
        }
        return { data: null, error: null };
      }),
    })),
  },
}));

// Mock AppLayout
vi.mock("@/components/AppLayout", () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-layout">{children}</div>
  ),
}));

// Import after mocks
import QRScanRouter from "@/pages/QRScanRouter";

describe("QRScanRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCode = "ABC123";
    mockSearchParams = new URLSearchParams();
    mockAuthUser = null;
    mockAuthLoading = false;
    mockQrData = null;
    mockUserData = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("when no code parameter is provided", () => {
    it("redirects to home", async () => {
      mockCode = undefined;

      render(<QRScanRouter />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
      });
    });
  });

  describe("when QR code doesn't exist", () => {
    it("displays error message", async () => {
      mockCode = "INVALID123";
      mockQrData = null;

      render(<QRScanRouter />);

      await waitFor(() => {
        expect(screen.getByText(/doesn't exist/i)).toBeInTheDocument();
      });
    });
  });

  describe("when QR code is unclaimed", () => {
    it("redirects to claim page when assigned_to is null", async () => {
      mockQrData = {
        loqatr_id: "ABC123",
        assigned_to: null,
        status: "unassigned",
      };

      render(<QRScanRouter />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/tag/ABC123", { replace: true });
      });
    });

    it("redirects to claim page when status is unassigned", async () => {
      mockQrData = {
        loqatr_id: "ABC123",
        assigned_to: 1,
        status: "unassigned",
      };

      render(<QRScanRouter />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/tag/ABC123", { replace: true });
      });
    });
  });

  describe("when QR code is claimed", () => {
    it("redirects owner to edit page", async () => {
      mockAuthUser = { id: "auth-user-123" };
      mockQrData = {
        loqatr_id: "ABC123",
        assigned_to: 42,
        status: "assigned",
      };
      mockUserData = { id: 42 };

      render(<QRScanRouter />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/my-tags/ABC123", { replace: true });
      });
    });

    it("redirects non-owner to finder page", async () => {
      mockAuthUser = { id: "auth-user-999" };
      mockQrData = {
        loqatr_id: "ABC123",
        assigned_to: 42,
        status: "assigned",
      };
      mockUserData = { id: 99 };

      render(<QRScanRouter />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/found/ABC123", { replace: true });
      });
    });

    it("redirects anonymous user to finder page", async () => {
      mockAuthUser = null;
      mockQrData = {
        loqatr_id: "ABC123",
        assigned_to: 42,
        status: "assigned",
      };

      render(<QRScanRouter />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/found/ABC123", { replace: true });
      });
    });
  });

  describe("scan parameter handling", () => {
    it("passes scan=true to finder page when present", async () => {
      mockSearchParams = new URLSearchParams({ scan: "true" });
      mockQrData = {
        loqatr_id: "ABC123",
        assigned_to: 42,
        status: "assigned",
      };

      render(<QRScanRouter />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/found/ABC123?scan=true", { replace: true });
      });
    });

    it("does not pass scan parameter when not present", async () => {
      mockSearchParams = new URLSearchParams();
      mockQrData = {
        loqatr_id: "ABC123",
        assigned_to: 42,
        status: "assigned",
      };

      render(<QRScanRouter />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/found/ABC123", { replace: true });
      });
    });
  });

  describe("loading state", () => {
    it("shows loading indicator while processing", () => {
      mockCode = "ABC123";

      render(<QRScanRouter />);

      expect(screen.getByText(/processing/i)).toBeInTheDocument();
    });
  });
});
