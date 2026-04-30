import "../styles/layout.css";

export default function Footer() {
  return (
    <footer className="footer">
      {/* LEFT SIDE */}
      <div className="footer-left">
        <h2 className="footer-title">
          <span className="need">Need</span>
          <span className="bridge">Bridge</span>
        </h2>
        <p className="footer-desc">
          Bridging the gap between donors and those in need.
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div className="footer-right">
        <h3>Contact Us</h3>
        <p>
          <strong>Email:</strong> support@needbridge.org
        </p>
        <p>
          <strong>Phone:</strong> +91 9876543210
        </p>
        <p>
          <strong>Location:</strong> India
        </p>
      </div>
    </footer>
  );
}