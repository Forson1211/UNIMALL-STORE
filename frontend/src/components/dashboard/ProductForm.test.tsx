import { fireEvent, render, screen, waitFor } from "@testing-library/react";
const { upload, toastError } = vi.hoisted(() => ({ upload: vi.fn(), toastError: vi.fn() }));
vi.mock("@/integrations/api/client", () => ({ api: { auth: { getUser: async () => ({ data: { user: { id: "seller" } } }) } } }));
vi.mock("@/lib/imageOptimizer", () => ({
  uploadOptimizedImage: upload,
  validateImageFile: () => ({ valid: true }),
  IMAGE_PRESETS: { productMain: {}, productSlot: {} },
}));
vi.mock("sonner", () => ({ toast: { error: toastError, success: vi.fn() } }));
import { ProductForm } from "./ProductForm";

const product = { id: "product", name: "A useful ceramic mug with a full descriptive product title", price: 25, stock: 0, status: "active", category: "Electronics", image_url: "https://example.com/mug.webp" };

beforeEach(() => vi.clearAllMocks());

it("saves zero stock without truncating the seller's title", () => {
  const onSave = vi.fn();
  render(<ProductForm open onClose={vi.fn()} onSave={onSave} product={product as never} />);
  fireEvent.click(screen.getByRole("button", { name: /update product/i }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ stock: 0, name: product.name }));
});

it("blocks submission until the cloud upload is confirmed", async () => {
  let finish: (value: unknown) => void;
  upload.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const onSave = vi.fn();
  const { container } = render(<ProductForm open onClose={vi.fn()} onSave={onSave} product={product as never} />);
  const input = document.querySelector('input[type="file"]')!;
  fireEvent.change(input, { target: { files: [new File(["image"], "mug.png", { type: "image/png" })] } });
  await waitFor(() => expect(upload).toHaveBeenCalled());
  expect(screen.getByRole("button", { name: /update product/i })).toBeDisabled();
  fireEvent.submit(document.querySelector("form")!);
  expect(onSave).not.toHaveBeenCalled();
  finish!({ publicUrl: "https://example.com/new-mug.webp" });
  await waitFor(() => expect(screen.getByRole("button", { name: /update product/i })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: /update product/i }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ image_url: "https://example.com/new-mug.webp" }));
});

it("reports failed uploads and keeps the previously saved image", async () => {
  upload.mockResolvedValue({ publicUrl: "", error: new Error("Storage unavailable") });
  const onSave = vi.fn();
  render(<ProductForm open onClose={vi.fn()} onSave={onSave} product={product as never} />);
  fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [new File(["image"], "mug.png", { type: "image/png" })] } });
  await waitFor(() => expect(toastError).toHaveBeenCalledWith("Storage unavailable"));
  fireEvent.click(screen.getByRole("button", { name: /update product/i }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ image_url: product.image_url }));
});
