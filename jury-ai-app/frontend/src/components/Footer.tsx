import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="row">
          <div className="col-md-3">
            <h5>
              <img src="/logo.png" alt="Jury AI" style={{ width: '30px', marginRight: '10px' }} />
              Jury AI
            </h5>
            <p>Your trusted AI-powered legal assistant providing comprehensive legal support, document analysis, and expert guidance for all your legal needs.</p>
            <div className="social-icons">
              <a href="#"><i className="fab fa-facebook-f"></i></a>
              <a href="#"><i className="fab fa-twitter"></i></a>
              <a href="#"><i className="fab fa-linkedin-in"></i></a>
              <a href="#"><i className="fab fa-instagram"></i></a>
              <a href="#"><i className="fab fa-youtube"></i></a>
            </div>
          </div>
          <div className="col-md-2">
            <h5>Quick Links</h5>
            <ul className="list-unstyled">
              <li><a href="/">Home</a></li>
              <li><a href="/chat">AI Chat</a></li>
              <li><a href="/templates">Templates</a></li>
              <li><a href="#">Document Retriver</a></li>
            </ul>
          </div>
          <div className="col-md-2">
            <h5>Legal Resources</h5>
            <ul className="list-unstyled">
              <li><a href="#">Indian Constitution</a></li>
              <li><a href="#">Supreme Court</a></li>
              <li><a href="#">High Courts</a></li>
              <li><a href="#">Legal Acts</a></li>
              <li><a href="#">Case Studies</a></li>
            </ul>
          </div>
          <div className="col-md-2">
            <h5>Support</h5>
            <ul className="list-unstyled">
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Feedback</a></li>
              <li><a href="#">Report issue</a></li>
            </ul>
          </div>
          <div className="col-md-3">
            <h5>Contact Info</h5>
            <ul className="list-unstyled">
              <li><i className="fas fa-map-marker-alt"></i> Pune, India</li>
              <li><i className="fas fa-phone-alt"></i> +91 9579635665</li>
              <li><i className="fas fa-envelope"></i> adityajare2004@gmail.com</li>
              <li><i className="fas fa-clock"></i> 24/7 Support</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 Jury AI. All rights reserved. | Developed By <b><i>Jury AI Team</i></b> for Legal Excellence</p>
          <div className="footer-links">
            <a href="#">Privacy Policy</a> | 
            <a href="#">Terms of Service</a> | 
            <a href="#">Disclaimer</a>
          </div>
        </div>
      </div>
      <a href="#" className="scroll-to-top">
        <i className="fas fa-arrow-up"></i>
      </a>
    </footer>
  );
};

export default Footer;
