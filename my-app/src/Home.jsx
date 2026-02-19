import "./Home.css";

function Home() {
  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <h1 className="degree">Degree Stack</h1>
      </section>

      {/* Description Section */}
      <section className="description-section">
        <div className="description-box">
          Your Next Chapter Starts Here!
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <h2 className="subheading">Testimonials</h2>
        <div className="testimonials-container">
          <div className="testimonial-card">
            "This is an amazing platform!"
            <span>- User 1</span>
          </div>
          <div className="testimonial-card">
            "Helped me build my skills fast."
            <span>- User 2</span>
          </div>
          <div className="testimonial-card">
            "Highly recommend to everyone."
            <span>- User 3</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
