import CTA from "../../Components/CTA/CTA";
import Features from "../../Components/Features/Features";
import Footer from "../../Components/Footer/Footer";
import Hero from "../../Components/Hero/Hero";
import HowItWorks from "../../Components/HowItWorks/HowitWorks";
import Nav from "../../Components/Nav/Nav";

const LandingPage = () => {
  return (
    <section className="landing-page">
      <header>
        <Nav />
      </header>

      <main>
        <Hero />
        <HowItWorks />
        <Features/>
        <CTA/>
      </main>


          <Footer />
        
    </section>
  );
};

export default LandingPage;