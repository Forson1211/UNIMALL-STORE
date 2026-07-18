import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSearch } from "@/contexts/SearchContext";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { SearchSuggestions } from "@/components/search/SearchSuggestions";

const trendingSearches = [
  "Wireless Earbuds",
  "Campus Hoodie",
  "Laptop Stand",
  "Psychology Books",
  "Yoga Mat",
];

const categories = ["All", ...PRODUCT_CATEGORIES.map((c) => c.label)];

export function SearchDialog() {
  const { isSearchOpen, closeSearch, performSearch } = useSearch();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query);
      setQuery("");
    }
  };

  const handleQuickSearch = (term: string) => {
    performSearch(term);
    setQuery("");
  };

  const handleCategoryClick = (category: string) => {
    navigate(`/products?category=${encodeURIComponent(category)}`);
    closeSearch();
  };

  useEffect(() => {
    if (!isSearchOpen) {
      setQuery("");
    }
  }, [isSearchOpen]);

  return (
    <Dialog open={isSearchOpen} onOpenChange={closeSearch}>
      <DialogContent className="sm:max-w-xl max-sm:fixed max-sm:inset-x-0 max-sm:top-0 max-sm:bottom-auto max-sm:left-0 max-sm:right-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-none max-sm:border-x-0 max-sm:border-t-0 max-sm:p-4 max-sm:gap-3 max-sm:h-auto max-sm:max-h-[85vh] max-sm:overflow-y-auto max-sm:data-[state=open]:slide-in-from-top max-sm:data-[state=open]:slide-in-from-left-0 max-sm:data-[state=open]:zoom-in-100 max-sm:data-[state=closed]:slide-out-to-top max-sm:data-[state=closed]:slide-out-to-left-0 max-sm:data-[state=closed]:zoom-out-100 max-sm:duration-350 max-sm:ease-premium-slide">
        <DialogHeader>
          <DialogTitle className="text-left max-sm:text-sm max-sm:text-muted-foreground">Search Products</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground max-sm:w-4 max-sm:h-4" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products, vendors, categories..."
            className="pl-10 pr-10 h-12 text-base max-sm:h-10 max-sm:text-sm max-sm:pl-9"
            autoFocus
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2"
              onClick={() => setQuery("")}
            >
              <X className="w-4 h-4" />
            </Button>
          )}

          {query.trim().length >= 2 && (
            <SearchSuggestions query={query} onNavigate={closeSearch} />
          )}
        </form>

        {query.trim().length < 2 && (
          <div className="space-y-6 pt-2 max-sm:space-y-4 max-sm:pt-1">
            {/* Categories */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 max-sm:mb-2 max-sm:text-xs">
                Categories
              </h4>
              <div className="flex flex-wrap gap-2 max-sm:gap-1.5">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant="outline"
                    size="sm"
                    onClick={() => handleCategoryClick(cat)}
                    className="rounded-full max-sm:text-xs max-sm:px-3 max-sm:h-8"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            {/* Trending Searches */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2 max-sm:mb-2 max-sm:text-xs">
                <TrendingUp className="w-4 h-4 max-sm:w-3.5 max-sm:h-3.5" />
                Trending Searches
              </h4>
              <div className="space-y-1 max-sm:space-y-0.5">
                {trendingSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleQuickSearch(term)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm max-sm:text-xs max-sm:py-1.5 max-sm:px-2"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
