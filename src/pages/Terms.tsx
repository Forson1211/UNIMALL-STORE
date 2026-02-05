import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Terms = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-24 pb-16">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
                    <div className="prose prose-orange dark:prose-invert max-w-none bg-card p-8 rounded-3xl border border-border shadow-xl">
                        <p className="text-muted-foreground mb-4">Last Updated: February 5, 2026</p>
                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Agreement to Terms</h2>
                            <p className="text-muted-foreground">By accessing or using our platform, you agree to be bound by these Terms of Service.</p>
                        </section>
                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. User Accounts</h2>
                            <p className="text-muted-foreground">You are responsible for maintaining the confidentiality of your account and password.</p>
                        </section>
                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Prohibited Activities</h2>
                            <p className="text-muted-foreground">Users may not engage in any illegal activities or violate the rights of others on our platform.</p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Terms;
