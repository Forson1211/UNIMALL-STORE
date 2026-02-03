import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Star, Package, ExternalLink } from "lucide-react";

const mockVendors = [
  { id: 1, name: "TechHub", avatar: "T", description: "Your one-stop shop for all tech accessories and gadgets.", campus: "University of Ghana", rating: 4.9, products: 45, verified: true },
  { id: 2, name: "BookWorm", avatar: "B", description: "Academic textbooks and study materials at student-friendly prices.", campus: "KNUST", rating: 4.7, products: 120, verified: true },
  { id: 3, name: "StyleCo", avatar: "S", description: "Trendy fashion and accessories for the modern student.", campus: "University of Ghana", rating: 4.8, products: 89, verified: true },
  { id: 4, name: "HealthyBites", avatar: "H", description: "Organic snacks, energy bars, and healthy meal options.", campus: "UCC", rating: 4.6, products: 34, verified: false },
  { id: 5, name: "StudyMart", avatar: "M", description: "Stationery, calculators, and everything you need for class.", campus: "Ashesi", rating: 4.8, products: 67, verified: true },
  { id: 6, name: "FitZone", avatar: "F", description: "Sports equipment, yoga mats, and fitness accessories.", campus: "KNUST", rating: 4.5, products: 28, verified: false },
];

const VendorCard = ({ vendor }: { vendor: typeof mockVendors[0] }) => (
  <div className="group bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300">
    <div className="flex items-start gap-4 mb-4">
      {/* Avatar */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shrink-0">
        {vendor.avatar}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors truncate">
            {vendor.name}
          </h3>
          {vendor.verified && (
            <span className="shrink-0 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
              Verified
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{vendor.campus}</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-gold text-gold" />
            <span className="font-medium">{vendor.rating}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Package className="w-4 h-4" />
            <span>{vendor.products} products</span>
          </div>
        </div>
      </div>
    </div>
    
    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
      {vendor.description}
    </p>
    
    <Link to={`/vendor/${vendor.id}`}>
      <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        Visit Store
        <ExternalLink className="w-4 h-4" />
      </Button>
    </Link>
  </div>
);

const Vendors = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
              Campus <span className="text-gradient-primary">Vendors</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Discover trusted student vendors selling quality products on your campus.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search vendors by name or campus..."
                className="pl-12 h-14 rounded-2xl text-base"
              />
            </div>
          </div>

          {/* Vendors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockVendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-16 p-8 bg-accent rounded-3xl">
            <h2 className="text-2xl font-bold text-foreground mb-2">Want to become a vendor?</h2>
            <p className="text-muted-foreground mb-6">Start selling your products to thousands of students today.</p>
            <Link to="/signup?role=vendor">
              <Button size="lg">Apply to Become a Vendor</Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Vendors;
