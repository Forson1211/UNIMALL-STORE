import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Faqs = () => {
    const faqs = [
        { q: "How do I buy a product?", a: "Find a product you like, click on it to see details, and use the checkout flow to purchase." },
        { q: "How do I become a vendor?", a: "Go to the Become a Vendor page, fill out the application, and wait for admin approval." },
        { q: "Are payments secure?", a: "Yes, we use secure payment gateways to process all transactions." },
        { q: "What is the return policy?", a: "Each vendor has their own return policy, please check the product description for details." },
    ];

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-24 pb-16">
                <div className="container mx-auto px-4 max-w-3xl">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
                        <p className="text-muted-foreground">Find answers to common questions about using our campus marketplace.</p>
                    </div>

                    <div className="bg-card p-6 md:p-10 rounded-[2.5rem] border border-border shadow-2xl">
                        <Accordion type="single" collapsible className="w-full">
                            {faqs.map((faq, i) => (
                                <AccordionItem key={i} value={`item-${i}`} className="border-b-border/50 px-2">
                                    <AccordionTrigger className="text-left text-lg font-semibold py-6 hover:no-underline hover:text-primary transition-colors">
                                        {faq.q}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground text-base pb-6 leading-relaxed">
                                        {faq.a}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Faqs;
