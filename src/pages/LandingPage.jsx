 import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden text-white font-sans">

      {/* Background Image */}
      <div
        className="fixed inset-0 -z-30 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1470&q=80')`,
          filter: "brightness(0.3) contrast(1.1)",
        }}
        aria-hidden="true"
      />

      {/* Overlay to darken image for contrast */}
      <div className="fixed inset-0 -z-20 bg-black/70" aria-hidden="true" />

      {/* Navbar */}
      <header className="flex justify-between items-center px-8 sm:px-16 py-6 relative z-10 bg-black/60 backdrop-blur-sm shadow-md">
        <h1 className="text-4xl font-extrabold tracking-tight select-none cursor-default text-white">
          AR <span className="text-white">Menu</span>
        </h1>
        <button
          onClick={() => navigate("/auth")}
          className="bg-white text-black font-semibold px-6 py-2 rounded-lg shadow-md hover:bg-gray-200 transition"
          aria-label="Login"
        >
          Login
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col-reverse md:flex-row items-center justify-between flex-1 px-6 sm:px-16 max-w-7xl mx-auto mt-12 md:mt-20 mb-12 relative z-10">
        {/* Left text content */}
        <div className="md:w-1/2 text-center md:text-left">
          <h2 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6 text-white drop-shadow-lg">
            Bring Your <span className="text-white">Restaurant Menu</span><br />
            <span className="text-white/90">to Life</span> with <br />
            <span className="text-white">Augmented Reality</span>
          </h2>

          <p className="text-lg sm:text-xl max-w-xl mx-auto md:mx-0 text-white/80 drop-shadow-md mb-8">
            Let your customers explore your dishes in stunning 3D, make ordering intuitive, <br />
            and create memorable dining experiences that boost your sales.
          </p>

          <div className="flex justify-center md:justify-start gap-4">
            <button
              onClick={() => navigate("/auth")}
              className="bg-white text-black px-8 py-4 font-bold rounded-xl shadow-md hover:bg-gray-200 transition transform hover:scale-105"
              aria-label="Get Started"
            >
              Get Started - It's Free
            </button>
            <button
              onClick={() => alert('Demo Video Coming Soon!')}
              className="border border-white text-white px-8 py-4 font-semibold rounded-xl hover:bg-white hover:text-black transition"
              aria-label="Watch Demo"
            >
              Watch Demo
            </button>
          </div>
        </div>

        {/* Right image or 3D mockup */}
        <div className="md:w-1/2 mb-12 md:mb-0 flex justify-center">
          <img
            src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80"
            alt="Restaurant AR Menu Example"
            className="rounded-3xl shadow-xl max-w-full w-96 md:w-auto"
            loading="lazy"
          />
        </div>
      </main>

      {/* How It Works Section */}
      <section className="bg-black/70 py-12 px-6 sm:px-16 relative z-10 text-center max-w-5xl mx-auto rounded-3xl shadow-lg">
        <h3 className="text-3xl font-bold text-white mb-10">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-white/90">
          {/* Step 1 */}
          <div className="flex flex-col items-center max-w-xs mx-auto bg-white/10 rounded-xl p-6 shadow-lg">
            <img
              src="https://cdn-icons-png.flaticon.com/512/2917/2917995.png"
              alt="Upload Menu"
              className="w-24 h-24 mb-6 filter invert"
              loading="lazy"
            />
            <h4 className="text-xl font-semibold mb-3">Upload Your Menu</h4>
            <p>
              Upload your restaurant’s menu easily through our dashboard.
            </p>
          </div>
          {/* Step 2 */}
          <div className="flex flex-col items-center max-w-xs mx-auto bg-white/10 rounded-xl p-6 shadow-lg">
            <img
              src="https://cdn-icons-png.flaticon.com/512/201/201623.png"
              alt="Create 3D Models"
              className="w-24 h-24 mb-6 filter invert"
              loading="lazy"
            />
            <h4 className="text-xl font-semibold mb-3">Create 3D Models</h4>
            <p>
              Our experts convert your dishes into stunning 3D AR experiences.
            </p>
          </div>
          {/* Step 3 */}
          <div className="flex flex-col items-center max-w-xs mx-auto bg-white/10 rounded-xl p-6 shadow-lg">
            <img
              src="https://cdn-icons-png.flaticon.com/512/2921/2921222.png"
              alt="Serve Customers"
              className="w-24 h-24 mb-6 filter invert"
              loading="lazy"
            />
            <h4 className="text-xl font-semibold mb-3">Serve Customers</h4>
            <p>
              Customers use their phones to explore dishes and order confidently.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-6 sm:px-16 max-w-6xl mx-auto relative z-10">
        <h3 className="text-3xl font-bold text-white mb-12 text-center">What Our Customers Say</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-white/90">
          {/* Testimonial 1 */}
          <div className="bg-black/60 rounded-xl p-6 shadow-lg flex flex-col justify-between border border-white/20">
            <p className="mb-6 italic">"Using AR Menu transformed our restaurant's customer experience. Orders increased by 30%!"</p>
            <div className="flex items-center gap-4">
              <img
                src="https://randomuser.me/api/portraits/women/79.jpg"
                alt="Customer 1"
                className="w-12 h-12 rounded-full object-cover border border-white/30"
              />
              <div>
                <p className="font-semibold text-white">Riya Sharma</p>
                <p className="text-sm text-white/70">Restaurant Owner</p>
              </div>
            </div>
          </div>
          {/* Testimonial 2 */}
          <div className="bg-black/60 rounded-xl p-6 shadow-lg flex flex-col justify-between border border-white/20">
            <p className="mb-6 italic">"Our customers love seeing dishes in AR before ordering. It's truly innovative."</p>
            <div className="flex items-center gap-4">
              <img
                src="https://randomuser.me/api/portraits/men/32.jpg"
                alt="Customer 2"
                className="w-12 h-12 rounded-full object-cover border border-white/30"
              />
              <div>
                <p className="font-semibold text-white">Amit Singh</p>
                <p className="text-sm text-white/70">Cafe Manager</p>
              </div>
            </div>
          </div>
          {/* Testimonial 3 */}
          <div className="bg-black/60 rounded-xl p-6 shadow-lg flex flex-col justify-between border border-white/20">
            <p className="mb-6 italic">"The setup was super easy and the support team is fantastic. Highly recommend AR Menu SaaS!"</p>
            <div className="flex items-center gap-4">
              <img
                src="https://randomuser.me/api/portraits/women/45.jpg"
                alt="Customer 3"
                className="w-12 h-12 rounded-full object-cover border border-white/30"
              />
              <div>
                <p className="font-semibold text-white">Sunita Verma</p>
                <p className="text-sm text-white/70">Restaurant Owner</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/70 py-6 text-center text-white font-semibold relative z-10 border-t border-white/20">
        Made with <span role="img" aria-label="love">❤️</span> by Saas Team &mdash; AR Menu &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
