import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, PackageSearch } from "lucide-react";
import { productService, StorefrontProduct } from "@/services/productService";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchSuggestionsProps {
  query: string;
  onNavigate?: () => void;
}

const highlightMatch = (text: string, query: string) => {
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <span className="font-bold">{text.slice(index, index + query.length)}</span>
      {text.slice(index + query.length)}
    </>
  );
};

export function SearchSuggestions({ query, onNavigate }: SearchSuggestionsProps) {
  const navigate = useNavigate();
  const trimmed = query.trim();
  const debouncedQuery = useDebounce(trimmed, 300);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["search-suggestions", debouncedQuery],
    queryFn: () => productService.getProducts({ search: debouncedQuery, limit: 6 }),
    enabled: debouncedQuery.length >= 2,
  });

  const trendingSearches = ["watches", "shoes", "nonstick cooking pot", "perfumes for men", "sneakers"];

  const handleTagClick = (tag: string) => {
    navigate(`/products?search=${encodeURIComponent(tag)}`);
    onNavigate?.();
  };

  const goToProduct = (product: StorefrontProduct) => {
    navigate(`/products/${product.id}`);
    onNavigate?.();
  };

  const seeAllResults = () => {
    navigate(`/products?search=${encodeURIComponent(trimmed)}`);
    onNavigate?.();
  };

  const showEmpty = debouncedQuery.length >= 2 && !isFetching && results.length === 0;

  if (trimmed.length < 2) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_8px_40px_-8px_rgba(0,0,0,0.18)] border border-gray-100 p-5 z-50 max-sm:relative max-sm:top-auto max-sm:mt-3 max-sm:shadow-none max-sm:border-0 max-sm:p-2">
        <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-3">
          Trending Searches
        </h4>
        <div className="flex flex-wrap gap-2">
          {trendingSearches.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-semibold transition-colors cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_8px_40px_-8px_rgba(0,0,0,0.18)] border border-gray-100 overflow-hidden z-50 max-h-[420px] overflow-y-auto max-sm:relative max-sm:top-auto max-sm:mt-3 max-sm:shadow-none max-sm:border-0 max-sm:max-h-none max-sm:overflow-y-visible max-sm:z-0">
      {showEmpty ? (
        <div className="flex items-center gap-3 px-4 py-5 text-sm text-gray-400 max-sm:px-2 max-sm:py-3 max-sm:text-xs">
          <PackageSearch className="w-5 h-5 max-sm:w-4 max-sm:h-4 shrink-0" />
          No products found for &ldquo;{trimmed}&rdquo;
        </div>
      ) : (
        <>
          {results.map((product, idx) => (
            <Fragment key={product.id}>
              {idx > 0 && <div className="h-px bg-gray-100 mx-4 max-sm:mx-2" />}
              <button
                type="button"
                onClick={() => goToProduct(product)}
                className="w-full flex items-center gap-3 px-4 py-3 max-sm:px-2 max-sm:py-2 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-9 h-9 max-sm:w-8 max-sm:h-8 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                  <img src={product.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm max-sm:text-xs font-medium text-gray-700 truncate">
                    {highlightMatch(product.name, trimmed)}
                  </p>
                  <p className="text-xs max-sm:text-[10px] text-gray-400 truncate">
                    {product.category} · GH₵{product.price.toFixed(2)} · {product.vendor}
                  </p>
                </div>
              </button>
            </Fragment>
          ))}

          {results.length > 0 && <div className="h-px bg-gray-100 mx-4 max-sm:mx-2" />}

          <button
            type="button"
            onClick={seeAllResults}
            className="w-full flex items-center gap-3 px-4 py-3 max-sm:px-2 max-sm:py-2 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="w-9 h-9 max-sm:w-8 max-sm:h-8 rounded-full bg-[#FF5500]/10 flex items-center justify-center shrink-0">
              <SearchIcon className="w-4 h-4 max-sm:w-3.5 max-sm:h-3.5 text-[#FF5500]" />
            </div>
            <p className="text-sm max-sm:text-xs font-semibold text-[#FF5500]">
              See all results for &ldquo;{trimmed}&rdquo;
            </p>
          </button>
        </>
      )}
    </div>
  );
}
