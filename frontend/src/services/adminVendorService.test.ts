const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/integrations/api/client", () => ({ api: { rpc } }));
import { adminService } from "./adminService";
beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); });

it("does not cache or report approvals rejected by the server", async () => {
  rpc.mockResolvedValue({ data: null, error: { message: "Approval denied" } });
  await expect(adminService.updateVendorStatus("seller", "approved")).rejects.toMatchObject({ message: "Approval denied" });
  expect(localStorage.getItem("unimall_vendor_status_seller")).toBeNull();
});

it("requires explicit server confirmation before reporting approval", async () => {
  rpc.mockResolvedValue({ data: false, error: null });
  await expect(adminService.updateVendorStatus("seller", "approved")).rejects.toThrow("did not confirm");
  rpc.mockResolvedValue({ data: true, error: null });
  await expect(adminService.updateVendorStatus("seller", "approved")).resolves.toBeUndefined();
});
