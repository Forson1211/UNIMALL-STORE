import { Link } from "react-router-dom";
import { Laptop, BookOpen, Shirt, Utensils, Headphones, Dumbbell, Palette, Gift } from "lucide-react";

const CategoriesSection = () => {
  const categories = [
    { icon: Laptop, name: "Electronics", count: "230+ items", color: "from-blue-500 to-cyan-500" },
    { icon: BookOpen, name: "Books & Notes", count: "450+ items", color: "from-amber-500 to-orange-500" },
    { icon: Shirt, name: "Fashion", count: "380+ items", color: "from-pink-500 to-rose-500" },
    { icon: Utensils, name: "Food & Snacks", count: "120+ items", color: "from-green-500 to-emerald-500" },
    { icon: Headphones, name: "Accessories", count: "290+ items", color: "from-purple-500 to-violet-500" },
    { icon: Dumbbell, name: "Sports", count: "85+ items", color: "from-red-500 to-orange-500" },
    { icon: Palette, name: "Art & Crafts", count: "95+ items", color: "from-teal-500 to-cyan-500" },
    { icon: Gift, name: "Gifts", count: "150+ items", color: "from-indigo-500 to-purple-500" },
  ];

  return (
    <section className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
          <div>
            <span className="inline-block px-4 py-1.5 bg-accent text-accent-foreground text-sm font-medium rounded-full mb-4">
              Categories
            </span>
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground">
              Shop by <span className="text-gradient-primary">Category</span>
            </h2>
          </div>
          <Link
            to="/products"
            className="text-primary font-medium hover:underline underline-offset-4"
          >
            View all categories →
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {categories.map((category, index) => (
            <Link
              key={index}
              to={`/products?category=${category.name.toLowerCase()}`}
              className="group relative overflow-hidden rounded-2xl p-6 lg:p-8 bg-card border border-border hover:border-transparent hover:shadow-lg transition-all duration-300"
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              {/* Icon */}
              <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <category.icon className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              
              {/* Content */}
              <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {category.name}
              </h3>
              <p className="text-sm text-muted-foreground">{category.count}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
