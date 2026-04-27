import { Link } from "react-router-dom";
import { Laptop, BookOpen, Shirt, Utensils, Headphones, Dumbbell, Palette, Gift, ArrowRight, Sparkles } from "lucide-react";

const categories = [
  {
    icon: Laptop,
    name: "Electronics",
    count: "230+ items",
    img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=400&fit=crop",
  },
  {
    icon: BookOpen,
    name: "Books & Notes",
    count: "450+ items",
    img: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop",
  },
  {
    icon: Shirt,
    name: "Fashion",
    count: "380+ items",
    img: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=400&fit=crop",
  },
  {
    icon: Utensils,
    name: "Food & Snacks",
    count: "120+ items",
    img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop",
  },
  {
    icon: Headphones,
    name: "Accessories",
    count: "290+ items",
    img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop",
  },
  {
    icon: Dumbbell,
    name: "Sports",
    count: "85+ items",
    img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop",
  },
  {
    icon: Palette,
    name: "Art & Crafts",
    count: "95+ items",
    img: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=400&fit=crop",
  },
  {
    icon: Gift,
    name: "Gifts",
    count: "150+ items",
    img: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&h=400&fit=crop",
  },
];

const CategoriesSection = () => {
  return (
    <section className="py-32 bg-secondary/5 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Simplified Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
              <Sparkles className="w-3 h-3" />
              Departments
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-foreground tracking-tighter mb-4">
              Shop by <span className="text-primary">Category</span>
            </h2>
            <p className="text-muted-foreground text-lg font-medium">
              Everything you need for your university journey, organized and ready to discover.
            </p>
          </div>
          <Link
            to="/products"
            className="group flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all"
          >
            Explore All
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Unified Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <Link
              key={index}
              to={`/products?category=${encodeURIComponent(category.name.toLowerCase())}`}
              className="group relative h-80 rounded-[2.5rem] overflow-hidden border border-border/40 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-700"
            >
              {/* Image with overlay */}
              <img
                src={category.img}
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Content Overlay */}
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center mb-4 transform -translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <category.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-black text-white tracking-tight mb-1">
                  {category.name}
                </h3>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest">
                  {category.count}
                </p>
              </div>

              {/* Hover Indicator */}
              <div className="absolute top-8 right-8 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center scale-0 group-hover:scale-100 transition-transform duration-500 shadow-xl">
                 <ArrowRight className="w-5 h-5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
