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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-left">Search Products</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products, vendors, categories..."
            className="pl-10 pr-10 h-12 text-base"
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
        </form>

        <div className="space-y-6 pt-2">
          {/* Categories */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Categories
            </h4>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant="outline"
                  size="sm"
                  onClick={() => handleCategoryClick(cat)}
                  className="rounded-full"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Trending Searches */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Trending Searches
            </h4>
            <div className="space-y-1">
              {trendingSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => handleQuickSearch(term)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
