import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, Target, Heart, Shield, ArrowRight, Sparkles, TrendingUp } from "lucide-react";

const About = () => {
  const values = [
    {
      icon: Users,
      title: "Community First",
      description: "We believe in the power of student communities. Every feature we build strengthens campus connections.",
    },
    {
      icon: Shield,
      title: "Trust & Safety",
      description: "Your security is our priority. We verify vendors and protect all transactions on our platform.",
    },
    {
      icon: Target,
      title: "Student Success",
      description: "We empower student entrepreneurs to build businesses and gain real-world experience.",
    },
    {
      icon: Heart,
      title: "Accessibility",
      description: "Quality products at student-friendly prices. Everyone deserves access to what they need.",
    },
  ];

  return (
    <div className="min-h-screen bg-white font-jakarta">
      <Navbar />

      <main>
        {/* Editorial Hero */}
        <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden border-b border-gray-100">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl">
              <div className="inline-flex items-center px-4 py-1.5 bg-[#FF5500]/10 border border-[#FF5500]/20 text-[#FF5500] text-[10px] font-black tracking-[0.2em] uppercase rounded-none mb-8">
                <Sparkles className="w-3 h-3 mr-2" />
                The Mission
              </div>
              <h1 className="text-4xl sm:text-6xl lg:text-9xl font-black text-gray-900 mb-10 tracking-tighter leading-[0.85] uppercase">
                Empowering <br />
                The Next <br />
                <span className="text-[#FF5500]">Generation.</span>
              </h1>
              <p className="text-xl lg:text-2xl text-gray-500 font-medium leading-relaxed max-w-2xl">
                Unimall was born from a simple idea: what if students could easily buy and sell within their own campus community?
              </p>
            </div>
          </div>
          
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gray-50 -skew-x-12 translate-x-32" />
        </section>

        {/* Refined Content Section */}
        <section className="py-20 lg:py-32 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              <div className="space-y-10">
                <h2 className="text-4xl lg:text-6xl font-black text-gray-900 leading-none tracking-tight">
                  Economic <br />Freedom for <br />Every Student.
                </h2>
                <div className="space-y-6 text-lg text-gray-500 leading-relaxed font-medium">
                  <p>
                    We're on a mission to create economic opportunities for students while making campus life more convenient. By connecting buyers and sellers within the same community, we reduce waste and support student entrepreneurs.
                  </p>
                  <p>
                    Whether you're selling handmade crafts, tutoring services, or textbooks, Unimall gives you the platform to reach customers who are just a short walk away.
                  </p>
                </div>
                
                <div className="flex items-center gap-10 pt-4">
                   <div>
                      <p className="text-4xl font-black text-gray-900 tracking-tighter">20K+</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Monthly Users</p>
                   </div>
                   <div>
                      <p className="text-4xl font-black text-[#FF5500] tracking-tighter">15+</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Campus Hubs</p>
                   </div>
                </div>
              </div>

              <div className="relative">
                <div className="aspect-[4/5] bg-gray-100 overflow-hidden rounded-none">
                   <img 
                    src="https://images.unsplash.com/photo-1523240715181-310f9d1f0d23?q=80&w=2000&auto=format&fit=crop" 
                    className="w-full h-full object-cover grayscale contrast-125"
                    alt="Campus Community"
                   />
                </div>
                <div className="absolute -bottom-10 -left-10 bg-gray-900 text-white p-10 max-w-xs shadow-2xl rounded-none">
                   <TrendingUp className="w-8 h-8 text-[#FF5500] mb-6" />
                   <p className="text-lg font-bold leading-tight mb-4">"Transforming how students interact with their campus economy."</p>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Founded 2024</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Professional Values Grid */}
        <section className="py-20 lg:py-32 bg-gray-50 border-y border-gray-100">
          <div className="container mx-auto px-4">
            <div className="mb-20">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">Our DNA</h2>
              <div className="w-16 h-1.5 bg-[#FF5500]" />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200 border border-gray-200">
              {values.map((value, index) => (
                <div key={index} className="p-12 bg-white hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 bg-gray-900 text-white flex items-center justify-center mb-10 rounded-full group-hover:bg-[#FF5500] transition-colors">
                    <value.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-4 tracking-tight uppercase">{value.title}</h3>
                  <p className="text-gray-500 font-medium leading-relaxed text-sm">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* High-End CTA */}
        <section className="py-40">
          <div className="container mx-auto px-4 text-center">
             <div className="max-w-4xl mx-auto">
                <h2 className="text-5xl lg:text-7xl font-black text-gray-900 mb-12 tracking-tighter leading-[0.9] uppercase">
                  Join the Campus <br />
                  <span className="text-[#FF5500]">Commerce Network.</span>
                </h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <Link to="/signup" className="w-full sm:w-auto">
                    <Button size="lg" className="h-16 px-12 w-full sm:w-auto rounded-none text-xs font-black uppercase tracking-[0.2em] bg-[#FF5500] hover:bg-[#e54a00] text-white shadow-2xl shadow-orange-500/20">
                      Get Started Now
                      <ArrowRight className="w-5 h-5 ml-4" />
                    </Button>
                  </Link>
                  <Link to="/vendor" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="h-16 px-12 w-full sm:w-auto rounded-none text-xs font-black uppercase tracking-[0.2em] border-gray-200 text-gray-900 hover:bg-gray-50 transition-all">
                      Become a Vendor
                    </Button>
                  </Link>
                </div>
             </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
