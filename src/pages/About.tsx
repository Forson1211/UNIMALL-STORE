import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, Target, Heart, Shield, ArrowRight } from "lucide-react";

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
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20">
        {/* Modern Hero Section */}
        <section className="relative py-24 lg:py-40 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary opacity-95" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse-soft" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-secondary/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="max-w-3xl mx-auto">
              <span className="inline-flex items-center px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-semibold rounded-full mb-8 animate-fade-in shadow-xl">
                <Heart className="w-4 h-4 mr-2" />
                Our Story
              </span>
              <h1 className="text-5xl lg:text-7xl font-extrabold text-white mb-8 tracking-tight leading-[1.1] animate-fade-in-up">
                Building the Future of
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-50 to-white"> Campus Commerce</span>
              </h1>
              <p className="text-xl lg:text-2xl text-white/90 leading-relaxed font-medium animate-fade-in-up"
                style={{ animationDelay: "0.1s" }}>
                Unimall was born from a simple idea: what if students could easily buy and sell within their own campus community? Today, we're making that vision a reality.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section - Redesigned */}
        <section className="py-24 lg:py-32 bg-background relative">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              <div className="relative group">
                <div className="absolute -inset-4 bg-primary/5 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <span className="inline-flex items-center px-4 py-1.5 bg-primary/5 text-primary text-sm font-bold rounded-full mb-8 border border-primary/10">
                    Our Mission
                  </span>
                  <h2 className="text-4xl lg:text-5xl font-black text-foreground mb-8 tracking-tight">
                    Empowering Students <br /> to <span className="text-primary">Thrive</span>
                  </h2>
                  <div className="space-y-6">
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      We're on a mission to create economic opportunities for students while making campus life more convenient. By connecting buyers and sellers within the same community, we reduce waste, support student entrepreneurs, and build stronger campus networks.
                    </p>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      Whether you're selling handmade crafts, tutoring services, or last semester's textbooks, Unimall gives you the platform to reach customers who are just a short walk away.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative h-full min-h-[400px]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-[2.5rem] p-1 shadow-2xl rotate-2" />
                <div className="absolute inset-0 bg-white rounded-[2.5rem] p-1 shadow-lg -rotate-2 group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-90" />
                  <div className="relative h-full flex flex-col items-center justify-center text-white text-center p-12">
                    <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center mb-8 animate-bounce-soft">
                      <Users className="w-12 h-12" />
                    </div>
                    <p className="text-7xl font-black mb-2 tracking-tighter">20+</p>
                    <p className="text-xl font-bold uppercase tracking-widest opacity-80">Universities Connected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section - Glassmorphic Cards */}
        <section className="py-24 lg:py-32 bg-secondary/5 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-20">
              <span className="inline-flex items-center px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-6">
                Our Values
              </span>
              <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
                What Drives Us
              </h2>
              <p className="text-muted-foreground text-lg">
                These core values guide everything we do at Unimall.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div key={index} className="group relative bg-white border border-border/50 p-8 rounded-[2rem] shadow-xl shadow-black/[0.02] hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[4rem] group-hover:bg-primary/10 transition-colors" />
                  <div className="w-16 h-16 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <value.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-primary rounded-3xl p-8 lg:p-16 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-4">
                Ready to Join Us?
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
                Whether you want to shop or sell, there's a place for you in the Unimall community.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/signup">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="heroOutline">
                    Contact Us
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
