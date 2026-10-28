import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
const auth = vi.hoisted(() => ({ user: null as { id: string; user_metadata?: { role: string } } | null, role: null as string | null, vendorStatus: null as string | null, isLoading: false }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));
function mount(allowedRoles?: ("admin" | "vendor")[]) {
  return render(<MemoryRouter initialEntries={["/protected"]}><Routes><Route path="/protected" element={<ProtectedRoute allowedRoles={allowedRoles}><p>Protected content</p></ProtectedRoute>} /><Route path="/login" element={<p>Sign in page</p>} /></Routes></MemoryRouter>);
}
beforeEach(() => { auth.user = null; auth.role = null; auth.vendorStatus = null; auth.isLoading = false; localStorage.clear(); });
it("waits for restored sessions before redirecting", () => { auth.isLoading = true; mount(["admin"]); expect(screen.getByText("Loading...")).toBeInTheDocument(); expect(screen.queryByText("Sign in page")).not.toBeInTheDocument(); });
it("redirects signed-out users to sign in", () => { mount(); expect(screen.getByText("Sign in page")).toBeInTheDocument(); });
it("denies staff pages when the server role is unresolved", () => { auth.user = { id: "buyer" }; mount(["admin"]); expect(screen.getByText("Access Denied")).toBeInTheDocument(); expect(screen.queryByText("Protected content")).not.toBeInTheDocument(); });
it("does not grant vendor access based on editable metadata or storage", () => {
  auth.user = { id: "buyer", user_metadata: { role: "vendor" } }; auth.role = "buyer";
  localStorage.setItem("unimall_vendor_status_buyer", "approved"); mount(["vendor"]);
  expect(screen.getByText("Access Denied")).toBeInTheDocument();
});
it("allows a server-authorized role", () => { auth.user = { id: "admin" }; auth.role = "admin"; mount(["admin"]); expect(screen.getByText("Protected content")).toBeInTheDocument(); });
