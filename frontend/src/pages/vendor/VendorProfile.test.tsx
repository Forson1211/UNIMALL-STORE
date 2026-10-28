import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
const { updateProfile, toastError, toastSuccess } = vi.hoisted(() => ({ updateProfile: vi.fn(), toastError: vi.fn(), toastSuccess: vi.fn() }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({
  user: { id: "seller", user_metadata: {} },
  profile: { store_name: "Test store", full_name: "Seller", phone: "0241234567", campus: "University of Ghana (Legon)", verified: false },
  updateProfile,
}) }));
vi.mock("@/contexts/SiteSettingsContext", () => ({ useSiteSettingsContext: () => ({ getSetting: (_key: string, fallback: unknown) => fallback }) }));
vi.mock("@/components/dashboard/DashboardLayout", () => ({ DashboardLayout: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/integrations/api/client", () => ({ api: {} }));
vi.mock("sonner", () => ({ toast: { error: toastError, success: toastSuccess } }));
import VendorProfile from "./VendorProfile";

it("does not claim to publish the store when profile persistence fails", async () => {
  updateProfile.mockResolvedValue({ error: new Error("Profile could not be saved") });
  render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><VendorProfile /></MemoryRouter></QueryClientProvider>);
  fireEvent.click(screen.getAllByRole("button", { name: /publish changes/i })[0]);
  await waitFor(() => expect(toastError).toHaveBeenCalledWith("Profile could not be saved"));
  expect(toastSuccess).not.toHaveBeenCalled();
  expect(localStorage.getItem("unimall_vendor_profile_seller")).toBeNull();
});
