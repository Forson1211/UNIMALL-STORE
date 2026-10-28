import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const state = vi.hoisted(() => ({
  getSession: vi.fn(), onAuthStateChange: vi.fn(), rpc: vi.fn(),
  maybeSingle: vi.fn(), single: vi.fn(), update: vi.fn(), toast: vi.fn(),
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: state.toast }) }));
vi.mock("@/integrations/api/client", () => {
  const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: state.maybeSingle, single: state.single, update: state.update };
  query.select.mockReturnValue(query); query.eq.mockReturnValue(query); state.update.mockReturnValue(query);
  const channel = { on: vi.fn(), subscribe: vi.fn() };
  channel.on.mockReturnValue(channel); channel.subscribe.mockReturnValue(channel);
  return { api: { tag: "test-client", rpc: state.rpc, from: vi.fn(() => query),
    auth: { getSession: state.getSession, onAuthStateChange: state.onAuthStateChange },
    channel: vi.fn(() => channel), removeChannel: vi.fn() } };
});
import { AuthProvider, useAuth } from "./AuthContext";
function Account() {
  const auth = useAuth();
  return <><p>{auth.isLoading ? "Loading account" : `Role: ${auth.role}`}</p><p>{auth.profile?.full_name}</p>
    <button onClick={async () => { const result = await auth.updateProfile({ full_name: "Changed name" }); if (result.error) document.title = result.error.message; }}>Save profile</button></>;
}
beforeEach(() => {
  localStorage.clear(); document.title = "";
  state.getSession.mockResolvedValue({ data: { session: { user: { id: "buyer-id", email: "admin@unimall.com", user_metadata: { role: "admin" } } } }, error: null });
  state.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  state.maybeSingle.mockResolvedValue({ data: { id: "profile-id", user_id: "buyer-id", full_name: "Campus Buyer" }, error: null });
  state.rpc.mockImplementation(function (this: { tag: string }, name: string) {
    if (this.tag !== "test-client") throw new Error("RPC lost its client binding");
    return Promise.resolve({ data: name === "get_user_role_text" ? "buyer" : null, error: null });
  });
  state.single.mockResolvedValue({ data: null, error: new Error("Profile write denied") });
});
function mount() { return render(<QueryClientProvider client={new QueryClient()}><AuthProvider><Account /></AuthProvider></QueryClientProvider>); }
it("resolves roles from the server with the client binding intact", async () => {
  localStorage.setItem("unimall_last_auth_role", "admin");
  mount(); await screen.findByText("Role: buyer");
  expect(screen.queryByText("Role: admin")).not.toBeInTheDocument();
  expect(state.rpc).toHaveBeenCalledWith("get_user_role_text", { _user_id: "buyer-id" });
});
it("does not report or cache a successful profile update when the database rejects it", async () => {
  mount(); await screen.findByText("Role: buyer");
  fireEvent.click(screen.getByText("Save profile"));
  await waitFor(() => expect(document.title).toBe("Profile write denied"));
  expect(screen.getByText("Campus Buyer")).toBeInTheDocument();
  expect(screen.queryByText("Changed name")).not.toBeInTheDocument();
  expect(localStorage.getItem("unimall_vendor_profile_buyer-id")).toBeNull();
});
