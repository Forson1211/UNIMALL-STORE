import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useLatestNews } from "./useLatestNews";

const { from, response } = vi.hoisted(() => ({
  from: vi.fn(),
  response: vi.fn(),
}));
vi.mock("@/integrations/api/client", () => ({ api: { from } }));

it("shares one request between preview consumers and reuses it on a fresh remount", async () => {
  const news = [{ id: "news-1", title: "Campus update" }];
  response.mockResolvedValue({ data: news, error: null });
  const query = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(),
    abortSignal: response,
  };
  from.mockReturnValue(query);
  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) =>
    <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const first = renderHook(() => [useLatestNews(), useLatestNews()], { wrapper });
  await waitFor(() => expect(first.result.current.every(query => query.isSuccess)).toBe(true));
  expect(from).toHaveBeenCalledTimes(1);
  first.unmount();
  const next = renderHook(() => useLatestNews(), { wrapper });
  expect(next.result.current.data).toEqual(news);
  expect(from).toHaveBeenCalledTimes(1);
  next.unmount();
  client.clear();
});
