import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Send, MessageSquare, HelpCircle, FileText } from "lucide-react";

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 1500);
  };

  const contactInfo = [
    { icon: Mail, label: "Email", value: "support@unimall.com", href: "mailto:support@unimall.com" },
    { icon: Phone, label: "Phone", value: "+233 XX XXX XXXX", href: "tel:+233XXXXXXXX" },
    { icon: MapPin, label: "Location", value: "Accra, Ghana", href: "#" },
  ];

  const helpTopics = [
    { icon: MessageSquare, title: "General Inquiry", description: "Questions about Unimall" },
    { icon: HelpCircle, title: "Support", description: "Need help with your account" },
    { icon: FileText, title: "Partnership", description: "Collaborate with us" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-20">
        {/* Modern Header Section */}
        <section className="relative py-24 lg:py-32 overflow-hidden mb-16">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-secondary" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="max-w-2xl mx-auto">
              <span className="inline-flex items-center px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-semibold rounded-full mb-8 animate-fade-in shadow-xl">
                <MessageSquare className="w-4 h-4 mr-2" />
                Get in Touch
              </span>
              <h1 className="text-5xl lg:text-7xl font-extrabold text-white mb-6 tracking-tight animate-fade-in-up">
                We'd Love to <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-50 to-white">Hear From You</span>
              </h1>
              <p className="text-xl text-white/90 font-medium animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                Have a question, suggestion, or just want to say hi? Reach out and we'll get back to you as soon as possible.
              </p>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-16">
            {/* Contact Form */}
            <div className="lg:col-span-3 bg-card rounded-3xl p-8 border border-border">
              <h2 className="text-2xl font-bold text-foreground mb-6">Send us a Message</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" placeholder="John" className="h-12" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" placeholder="Doe" className="h-12" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" placeholder="you@university.edu" className="h-12" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="How can we help?" className="h-12" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us more about your inquiry..."
                    className="min-h-[150px] resize-none"
                    required
                  />
                </div>

                <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Message"}
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Details */}
              <div className="bg-gradient-primary rounded-3xl p-8 text-primary-foreground">
                <h3 className="text-xl font-bold mb-6">Contact Information</h3>
                <div className="space-y-6">
                  {contactInfo.map((info, index) => (
                    <a
                      key={index}
                      href={info.href}
                      className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <info.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-primary-foreground/70">{info.label}</p>
                        <p className="font-medium">{info.value}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Help Topics */}
              <div className="bg-card rounded-3xl p-8 border border-border">
                <h3 className="text-xl font-bold text-foreground mb-6">How can we help?</h3>
                <div className="space-y-4">
                  {helpTopics.map((topic, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                        <topic.icon className="w-5 h-5 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{topic.title}</p>
                        <p className="text-sm text-muted-foreground">{topic.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
