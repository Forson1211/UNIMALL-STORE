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
      
      <main className="pt-24">
        {/* Hero */}
        <section className="py-16 lg:py-24 bg-accent">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-6">
                Our Story
              </span>
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
                Building the Future of
                <span className="text-gradient-primary"> Campus Commerce</span>
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground">
                Unimall was born from a simple idea: what if students could easily buy and sell within their own campus community? Today, we're making that vision a reality across universities nationwide.
              </p>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 bg-coral-light text-coral text-sm font-medium rounded-full mb-6">
                  Our Mission
                </span>
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
                  Empowering Students to Thrive
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  We're on a mission to create economic opportunities for students while making campus life more convenient. By connecting buyers and sellers within the same community, we reduce waste, support student entrepreneurs, and build stronger campus networks.
                </p>
                <p className="text-lg text-muted-foreground">
                  Whether you're selling handmade crafts, tutoring services, or last semester's textbooks, Unimall gives you the platform to reach customers who are just a short walk away.
                </p>
              </div>
              <div className="bg-gradient-hero rounded-3xl aspect-video flex items-center justify-center">
                <div className="text-center text-white p-8">
                  <p className="text-6xl font-bold mb-4">20+</p>
                  <p className="text-xl">Universities Connected</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="inline-block px-4 py-1.5 bg-accent text-accent-foreground text-sm font-medium rounded-full mb-4">
                Our Values
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                What Drives Us
              </h2>
              <p className="text-muted-foreground text-lg">
                These core values guide everything we do at Unimall.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <div key={index} className="bg-card p-6 rounded-2xl border border-border">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                    <value.icon className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm">{value.description}</p>
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
