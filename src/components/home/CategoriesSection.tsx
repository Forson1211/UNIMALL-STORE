import { Link } from "react-router-dom";
import { Apple, Smartphone, Sparkles, Home, Coffee, Tv, Monitor, Shirt, ArrowRight } from "lucide-react";

const categories = [
  {
    icon: Apple,
    name: "Supermarket",
    count: "350+ items",
    img: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop",
  },
  {
    icon: Smartphone,
    name: "Phones & Tablets",
    count: "290+ items",
    img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=400&fit=crop",
  },
  {
    icon: Sparkles,
    name: "Health & Beauty",
    count: "180+ items",
    img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=400&fit=crop",
  },
  {
    icon: Home,
    name: "Home & Office",
    count: "210+ items",
    img: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&h=400&fit=crop",
  },
  {
    icon: Coffee,
    name: "Appliances",
    count: "150+ items",
    img: "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&h=400&fit=crop",
  },
  {
    icon: Tv,
    name: "Electronics",
    count: "250+ items",
    img: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600&h=400&fit=crop",
  },
  {
    icon: Monitor,
    name: "Computing",
    count: "310+ items",
    img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=400&fit=crop",
  },
  {
    icon: Shirt,
    name: "Fashion",
    count: "380+ items",
    img: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=400&fit=crop",
  },
];

const CategoriesSection = () => {
  return (
    <section className="py-8 md:py-32 bg-[#fafafa] overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8 lg:mb-16">
          <div className="max-w-none">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-none bg-primary text-white text-xs font-black uppercase tracking-widest mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Store Departments
            </div>
            <h2 className="text-2xl xs:text-3xl sm:text-5xl lg:text-7xl font-black text-foreground tracking-tighter mb-4 leading-tight uppercase">
              Shop by <span className="text-primary">Category</span>
            </h2>
            <p className="text-muted-foreground text-lg font-semibold leading-relaxed max-w-md">
              Everything you need for your university journey, perfectly organized for quick discovery.
            </p>
          </div>
          <Link
            to="/products"
            className="group flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all pb-2 border-b-2 border-transparent hover:border-primary"
          >
            Explore Catalog
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Unified Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border border-border/20">
          {categories.map((category, index) => (
            <Link
              key={index}
              to={`/products?category=${encodeURIComponent(category.name)}`}
              className="group relative aspect-square rounded-none overflow-hidden border border-border/10 hover:shadow-2xl transition-all duration-700"
            >
              {/* Image with overlay */}
              <img
                src={category.img}
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Content Overlay */}
              <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-none bg-primary text-white flex items-center justify-center mb-4 transform -translate-x-8 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 shadow-xl">
                  <category.icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <h3 className="text-lg md:text-2xl font-black text-white tracking-tighter mb-1 md:mb-2 uppercase leading-none">
                  {category.name}
                </h3>
                <div className="h-0.5 w-6 md:w-8 bg-primary/60 group-hover:w-16 transition-all duration-500 mb-2 md:mb-4" />
                <p className="text-white/60 text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
                  {category.count}
                </p>
              </div>

              {/* Hover Indicator */}
              <div className="absolute top-6 right-6 md:top-10 md:right-10 w-10 h-10 md:w-12 md:h-12 rounded-none bg-white text-foreground flex items-center justify-center translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 shadow-2xl">
                 <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
