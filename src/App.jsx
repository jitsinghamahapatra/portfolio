import React, { useState, useEffect } from 'react';
import AdminDashboard from './components/AdminDashboard.jsx';

export default function App() {
  const [view, setView] = useState(() => {
    const path = window.location.pathname;
    if (path === '/admin') return 'admin';
    if (path === '/contact') return 'contact';
    return 'home';
  });
  const [portfolio, setPortfolio] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [menuActive, setMenuActive] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Contact Form State
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [formStatus, setFormStatus] = useState({ type: '', text: '' });
  const [formLoading, setFormLoading] = useState(false);

  // Sync state-based route with browser history
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/admin') setView('admin');
      else if (path === '/contact') setView('contact');
      else setView('home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    if (path === '/admin') setView('admin');
    else if (path === '/contact') setView('contact');
    else setView('home');
    setMenuActive(false);
    // Scroll to top on page navigate
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Fetch portfolio data
  const loadPortfolioData = async () => {
    try {
      setLoadError(null);
      const res = await fetch('/api/portfolio');
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data);
      } else {
        setLoadError(`Server responded with status ${res.status}`);
      }
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      setLoadError("Could not connect to the backend API server. Please ensure the Express backend server is running.");
    }
  };

  useEffect(() => {
    loadPortfolioData();
  }, [view]);

  // Handle scroll behaviors (back to top button)
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle nav clicks smoothly across pages
  const handleNavLink = (e, anchor) => {
    if (anchor === 'resume') return; // let natural link action trigger
    e.preventDefault();
    setMenuActive(false);

    if (anchor === 'contact') {
      navigateTo('/contact');
      return;
    }

    if (view !== 'home') {
      navigateTo('/');
      // Wait for home component to mount before scrolling
      setTimeout(() => {
        const element = document.getElementById(anchor);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    } else {
      const element = document.getElementById(anchor);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setFormStatus({ type: '', text: '' });

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setFormStatus({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFormStatus({ type: 'success', text: 'Your message was sent! Thank you.' });
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setFormStatus({ type: 'error', text: data.error || 'Something went wrong. Please try again.' });
      }
    } catch (error) {
      setFormStatus({ type: 'error', text: 'Network connection error. Please try again later.' });
    } finally {
      setFormLoading(false);
    }
  };

  if (view === 'admin') {
    return <AdminDashboard onBackToPortfolio={() => navigateTo('/')} />;
  }

  if (!portfolio) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F3F0E7' }}>
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-sans)', padding: '20px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1A3C34', marginBottom: '10px' }}>✦ Jit</div>
          {loadError ? (
            <div style={{ color: '#d9534f', maxWidth: '400px', margin: '0 auto' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Error Loading Portfolio</p>
              <p style={{ fontSize: '0.9rem', marginBottom: '15px' }}>{loadError}</p>
              <button 
                onClick={loadPortfolioData} 
                style={{ 
                  background: '#1A3C34', 
                  color: 'white', 
                  border: 'none', 
                  padding: '8px 16px', 
                  borderRadius: '25px', 
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                Retry Connection
              </button>
            </div>
          ) : (
            <div style={{ color: '#666' }}>Loading portfolio details...</div>
          )}
        </div>
      </div>
    );
  }

  const { name, title, bio, linkedin, contact, education, experience, tags, activities, skills, languages, hobbies, resumeUrl, avatarUrl } = portfolio;
  
  // Name split for background outline text formatting
  const nameParts = name.split(' ');
  const firstName = nameParts[0] || 'Jit';
  const lastName = nameParts.slice(1).join(' ') || 'Singha Mahapatra';

  // Capitalize and split for animated background sliding marquee text
  const nameUpper = name.toUpperCase();
  const nameTokens = nameUpper.split(' ');
  const bgLine1 = 'PORTFOLIO';
  let bgLine2 = '';
  let bgLine3 = '';
  if (nameTokens.length >= 3) {
    bgLine2 = nameTokens.slice(0, 2).join(' ');
    bgLine3 = nameTokens.slice(2).join(' ');
  } else {
    bgLine2 = nameTokens[0] || '';
    bgLine3 = nameTokens.slice(1).join(' ') || '';
  }

  return (
    <div>
      {/* VIEW: CONTACT DEDICATED PAGE */}
      {view === 'contact' ? (
        <div>
          {/* Simplified Navbar for Contact Page */}
          <header className="header-contact-page">
            <div className="container">
              <nav className="nav-bar">
                <div className="logo" onClick={() => navigateTo('/')} style={{ cursor: 'pointer' }}>
                  <h2>✦ {firstName}</h2>
                </div>

                <div className={`hamburger ${menuActive ? 'active' : ''}`} onClick={() => setMenuActive(!menuActive)}>
                  <span className="bar"></span>
                  <span className="bar"></span>
                  <span className="bar"></span>
                </div>

                <div className={`nav-links ${menuActive ? 'active' : ''}`}>
                  <a href="#about" onClick={(e) => handleNavLink(e, 'about')}>About me</a>
                  <a href={resumeUrl} target="_blank" rel="noreferrer">Resume</a>
                  <a href="#contact" onClick={(e) => handleNavLink(e, 'contact')}>Contact</a>
                  <a href="#contact" className="btn-contact" onClick={(e) => handleNavLink(e, 'contact')}>Get in touch!</a>
                  <a href="/admin" onClick={(e) => { e.preventDefault(); navigateTo('/admin'); }} style={{ color: 'var(--accent-yellow)', fontSize: '0.85rem', fontWeight: 'bold' }}>Admin Console</a>
                </div>
              </nav>
            </div>
          </header>

          <div className="contact-page-view" style={{ paddingTop: '50px' }}>
            <div className="container">
              <div className="contact-page-header">
                <h1>Let's Connect</h1>
                <p>Have a question or want to work together? Drop me a message below!</p>
              </div>

              <div className="contact-page-grid">
                {/* Contact Info Panel */}
                <div className="contact-page-info">
                  <h3>Contact Information</h3>
                  <p>Feel free to reach out via email, phone, or LinkedIn. I usually respond within 24 hours.</p>
                  
                  <div className="contact-page-details">
                    {contact?.location && (
                      <div className="detail-item">
                        <span className="detail-icon">📍</span>
                        <div>
                          <h5>Location</h5>
                          <p>{contact.location}</p>
                        </div>
                      </div>
                    )}
                    {contact?.email && (
                      <div className="detail-item">
                        <span className="detail-icon">✉️</span>
                        <div>
                          <h5>Email</h5>
                          <p><a href={`mailto:${contact.email}`}>{contact.email}</a></p>
                        </div>
                      </div>
                    )}
                    {contact?.phone && (
                      <div className="detail-item">
                        <span className="detail-icon">📞</span>
                        <div>
                          <h5>Phone</h5>
                          <p>{contact.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="contact-page-socials">
                    <a href={linkedin} target="_blank" rel="noreferrer" className="social-icon-btn">
                      LinkedIn
                    </a>
                    <a href="https://github.com/jitsinghamahapatra" target="_blank" rel="noreferrer" className="social-icon-btn">
                      GitHub
                    </a>
                  </div>
                </div>

                {/* Contact Form Panel */}
                <div className="contact-page-form-wrapper">
                  <h3>Leave a Message</h3>
                  {formStatus.text && (
                    <div className={`form-alert ${formStatus.type}`}>
                      {formStatus.text}
                    </div>
                  )}
                  <form onSubmit={handleContactSubmit}>
                    <div className="form-group">
                      <label htmlFor="form-name">Name *</label>
                      <input
                        type="text"
                        id="form-name"
                        className="form-input"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="form-email">Email *</label>
                      <input
                        type="email"
                        id="form-email"
                        className="form-input"
                        placeholder="Your email address"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="form-subject">Subject</label>
                      <input
                        type="text"
                        id="form-subject"
                        className="form-input"
                        placeholder="Subject (Optional)"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="form-message">Message *</label>
                      <textarea
                        id="form-message"
                        className="form-textarea"
                        placeholder="Write your message here..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                      ></textarea>
                    </div>
                    <button type="submit" className="form-submit-btn" disabled={formLoading}>
                      {formLoading ? 'Sending message...' : 'Submit Message'}
                    </button>
                  </form>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <button className="btn-back-home" onClick={() => navigateTo('/')}>
                  ← Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW: HOME PORTFOLIO (1ST VERSION HERO RECOLLECTED) */
        <div>
          <header>
            <div className="container">
              <nav className="nav-bar">
                <div className="logo" onClick={() => navigateTo('/')} style={{ cursor: 'pointer' }}>
                  <h2>✦ {firstName}</h2>
                </div>

                <div className={`hamburger ${menuActive ? 'active' : ''}`} onClick={() => setMenuActive(!menuActive)}>
                  <span className="bar"></span>
                  <span className="bar"></span>
                  <span className="bar"></span>
                </div>

                <div className={`nav-links ${menuActive ? 'active' : ''}`}>
                  <a href="#about" onClick={(e) => handleNavLink(e, 'about')}>About me</a>
                  <a href={resumeUrl} target="_blank" rel="noreferrer">Resume</a>
                  <a href="#contact" onClick={(e) => handleNavLink(e, 'contact')}>Contact</a>
                  <a href="#contact" className="btn-contact" onClick={(e) => handleNavLink(e, 'contact')}>Get in touch!</a>
                  <a href="/admin" onClick={(e) => { e.preventDefault(); navigateTo('/admin'); }} style={{ color: 'var(--accent-yellow)', fontSize: '0.85rem', fontWeight: 'bold' }}>Admin Console</a>
                </div>
              </nav>

              <div className="big-text-bg">
                <div className="bg-line line-portfolio">{bgLine1}</div>
                <div className="bg-line line-name">{bgLine2}</div>
                <div className="bg-line line-lastname">{bgLine3}</div>
              </div>

              <div className="hero-content">
                <div className="hero-image-wrapper">
                  <img src={avatarUrl} alt="Profile Photo" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=400&h=500&q=80" }} />
                  <a href="#intro" className="scroll-down" onClick={(e) => handleNavLink(e, 'intro')}>
                    Scroll<br />down
                  </a>
                </div>
              </div>
            </div>
          </header>

          {/* PORTFOLIO CONTENT */}
          <div className="container main-content" id="intro">
            <section className="intro-section" id="about">
              <h1>{title.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br /></React.Fragment>)}</h1>
              <p>{bio}</p>
              <a href={linkedin} target="_blank" rel="noreferrer" className="linkedin-btn">linkedin</a>
            </section>

            <div className="grid-layout">
              {/* LEFT COLUMN */}
              <div className="left-col">
                {/* EDUCATION */}
                {education && education.length > 0 && (
                  <section>
                    <h2 className="section-title">Education</h2>
                    {education.map((edu) => (
                      <div key={edu.id} className="timeline-item">
                        <span className="timeline-date">{edu.date}</span>
                        <div className="timeline-title">{edu.title}</div>
                        <div className="timeline-subtitle">{edu.subtitle}</div>
                      </div>
                    ))}
                  </section>
                )}

                {/* EXPERIENCE */}
                {experience && experience.length > 0 && (
                  <div className="experience-box">
                    <h2 className="section-title">Experience</h2>
                    {experience.map((exp) => (
                      <div key={exp.id} className="timeline-item">
                        <span className="timeline-date">{exp.date}</span>
                        <div className="timeline-title">{exp.title}</div>
                        <div className="timeline-subtitle">{exp.subtitle}</div>
                        {exp.description && <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>{exp.description}</p>}
                      </div>
                    ))}

                    {/* TAGS */}
                    {tags && tags.length > 0 && (
                      <div className="tag-container">
                        {tags.map((tag, i) => (
                          <span key={i} className="tag">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ACTIVITIES */}
                {activities && activities.length > 0 && (
                  <section style={{ marginTop: '40px' }}>
                    <h2 className="section-title" style={{ color: 'var(--dark-green)' }}>Activities</h2>
                    {activities.map((act) => (
                      <div key={act.id} className="timeline-item">
                        <span className="timeline-date">{act.date}</span>
                        <div className="timeline-title">{act.title}</div>
                        <div className="timeline-subtitle">{act.subtitle}</div>
                      </div>
                    ))}
                  </section>
                )}
              </div>

              {/* RIGHT COLUMN */}
              <div className="right-col">
                {/* CONTACT CARD */}
                <div className="contact-card" id="contact">
                  <span className="sticker-badge">Location Info</span>
                  <h3>Contact</h3>
                  <div className="contact-info" style={{ marginBottom: '25px' }}>
                    {contact?.location && <p>📍 {contact.location}</p>}
                    {contact?.email && <p>✉️ <a href={`mailto:${contact.email}`} style={{ color: 'inherit', textDecoration: 'underline' }}>{contact.email}</a></p>}
                    {contact?.phone && <p>📞 {contact.phone}</p>}
                  </div>
                  
                  {/* Link Button to Separate Contact Page */}
                  <button className="form-submit-btn" onClick={() => navigateTo('/contact')} style={{ background: 'var(--accent-yellow)', color: 'var(--dark-green)' }}>
                    Send a Message ✉️
                  </button>

                  <div
                    style={{ position: 'absolute', bottom: 0, right: 0, opacity: 0.1, fontFamily: 'var(--font-display)', fontSize: '4rem', lineHeight: 0.8, pointerEvents: 'none' }}>
                    RESUME<br />RESUME
                  </div>
                </div>

                {/* SKILLS */}
                {skills && (
                  <>
                    <div className="skills-grid">
                      {skills.software && skills.software.length > 0 && (
                        <div className="skill-category">
                          <h4>Software Skills</h4>
                          <div className="software-icons">
                            {skills.software.map((sw, i) => (
                              <span key={i}>{sw}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {skills.coding && (
                        <div className="skill-category">
                          <h4>Coding Skills</h4>
                          <p style={{ fontSize: '0.8rem', marginBottom: '5px' }}>Advanced knowledge of:</p>
                          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', whiteSpace: 'pre-line' }}>
                            {skills.coding}
                          </div>
                        </div>
                      )}
                    </div>

                    {skills.pills && skills.pills.length > 0 && (
                      <div className="skills-grid">
                        <div className="skill-category" style={{ gridColumn: 'span 2' }}>
                          <div className="tag-container" style={{ justifyContent: 'center' }}>
                            {skills.pills.map((pill, i) => (
                              <span key={i} className="pill-list" style={{ background: '#1A3C34', color: 'white', padding: '8px 12px', borderRadius: '10px' }}>
                                {pill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* HOBBIES & LANGUAGES ROW */}
                <div className="hobbies-lang-container">
                  {/* HOBBIES */}
                  {hobbies && hobbies.length > 0 && (
                    <div className="hobbies-section">
                      <h2 className="section-title" style={{ color: 'var(--dark-green)', fontSize: '2rem' }}>Hobbies</h2>
                      <div className="hobbies-grid">
                        {hobbies.map((hb) => (
                          <div key={hb.id} className="hobby-item">
                            <div className="hobby-icon">{hb.icon}</div>
                            <span style={{ fontSize: '0.8rem' }}>{hb.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* LANGUAGES */}
                  {languages && languages.length > 0 && (
                    <div className="lang-section">
                      <h2 className="section-title" style={{ color: 'var(--dark-green)', fontSize: '2rem' }}>Language</h2>
                      <div className="lang-grid">
                        {languages.map((lang) => (
                          <div key={lang.id} className="lang-item">
                            <h5>{lang.name}</h5>
                            <p>{lang.level}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer>
        <div className="container footer-wrapper">
          <div className="footer-brand">
            <div className="footer-logo">
              {name}
            </div>
            <p className="copyright">
              @ {new Date().getFullYear()} {firstName}'s Portfolio.<br />
              All rights reserved.
            </p>
          </div>

          <div className="footer-nav">
            <div className="footer-col">
              <h5>Services</h5>
              <a href="#">UI Design</a>
              <a href="#">Web Development</a>
              <a href="#">Prototyping</a>
              <a href="#">Consulting</a>
            </div>

            <div className="footer-col">
              <h5>Navigation</h5>
              <a href="#about" onClick={(e) => handleNavLink(e, 'about')}>About</a>
              <a href={resumeUrl} target="_blank" rel="noreferrer">Resume</a>
              <a href="#contact" onClick={(e) => handleNavLink(e, 'contact')}>Contact</a>
            </div>

            <div className="footer-col">
              <h5>Legal</h5>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Use</a>
              <a href="#">Cookies</a>
            </div>

            <div className="footer-col">
              <h5>Socials</h5>
              <a href={linkedin} target="_blank" rel="noreferrer" className="social-link">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                LinkedIn
              </a>
              <a href="https://github.com/jitsinghamahapatra" target="_blank" rel="noreferrer" className="social-link">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* TO TOP SCROLL BUTTON */}
      <button
        className={`to-top ${showScrollTop ? 'active' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Scroll to top"
      >
        ↑
      </button>
    </div>
  );
}
