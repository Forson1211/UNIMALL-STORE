import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Privacy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-24 pb-16">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
                    <div className="prose prose-orange dark:prose-invert max-w-none bg-card p-8 rounded-3xl border border-border shadow-xl">
                        <p className="text-muted-foreground mb-4">Last Updated: February 5, 2026</p>
                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Introduction</h2>
                            <p className="text-muted-foreground">Welcome to our Campus Connect Marketplace. We value your privacy and are committed to protecting your personal data.</p>
                        </section>
                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Data We Collect</h2>
                            <p className="text-muted-foreground">We collect information you provide directly to us when you create an account, list a product, or make a purchase.</p>
                        </section>
                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. How We Use Your Information</h2>
                            <p className="text-muted-foreground">We use the information to facilitate transactions, improve our services, and communicate with you about your account.</p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Privacy;
