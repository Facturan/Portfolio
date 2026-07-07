import React, { useEffect, useRef, useState } from 'react';

// Counter Animator Component to handle target counting inside view
const Counter = ({ target, suffix, label }) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let start = null;
          const duration = 1800;

          const step = (timestamp) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            setCount(Math.floor(ease * target));
            if (progress < 1) {
              requestAnimationFrame(step);
            }
          };
          requestAnimationFrame(step);
        } else if (!entry.isIntersecting) {
          hasAnimated.current = false;
          setCount(0);
        }
      },
      { threshold: 0.2 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={elementRef}>
      <div className="stat-num">{count}{suffix}</div>
      {label && <div className="stat-label">{label}</div>}
    </div>
  );
};

// WorkCard Component to manage individual card tilt and fallback images
const WorkCard = ({ title, category, description, imageUrl, isLarge, fallbackChar, onImageClick }) => {
  const cardRef = useRef(null);
  const [imageError, setImageError] = useState(false);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const r = card.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 8;
    const y = ((e.clientY - r.top) / r.height - 0.5) * -8;
    card.style.transform = `perspective(800px) rotateX(${y}deg) rotateY(${x}deg) translateY(-6px)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = '';
  };

  return (
    <div
      ref={cardRef}
      className={`work-card ${isLarge ? 'large' : ''} reveal`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {!imageError && imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          className="work-img"
          loading="lazy"
          onError={() => setImageError(true)}
          onClick={() => onImageClick && onImageClick(imageUrl, title)}
          style={{ cursor: 'zoom-in' }}
        />
      ) : (
        <div
          className="work-img-placeholder"
          style={{
            background: isLarge
              ? 'linear-gradient(135deg, #e8e6e0 0%, #d4d0c8 100%)'
              : 'linear-gradient(135deg, #1a1a18 0%, #3a3a36 100%)',
            color: isLarge ? 'var(--ink)' : '#f5f4f0',
            aspectRatio: isLarge ? '21/9' : '16/9',
            fontSize: '3rem',
          }}
        >
          {fallbackChar}
        </div>
      )}
      <div className="work-info">
        <div className="work-cat">{category}</div>
        <h3 className="work-title">{title}</h3>
        <p className="work-desc">{description}</p>
        <a href="#" className="work-arrow" onClick={(e) => e.preventDefault()}>
          View Project <span>&rarr;</span>
        </a>
      </div>
    </div>
  );
};

// Lightbox Component
const Lightbox = ({ src, title, onClose }) => {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={title} className="lightbox-img" />
        {title && <p className="lightbox-caption">{title}</p>}
      </div>
    </div>
  );
};

function App() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const cursorDotRef = useRef(null);
  const cursorRingRef = useRef(null);
  const hasMouse = useRef(false);

  useEffect(() => {
    // Add custom cursor class to body if using fine pointer device
    const pointerQuery = window.matchMedia('(pointer: fine)');
    if (pointerQuery.matches) {
      document.body.classList.add('has-custom-cursor');
    }

    // Custom Cursor tracking
    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;
    let rafId = null;

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      hasMouse.current = true;

      if (cursorDotRef.current) {
        cursorDotRef.current.style.left = `${mouseX}px`;
        cursorDotRef.current.style.top = `${mouseY}px`;
        cursorDotRef.current.style.opacity = '1';
      }
      if (cursorRingRef.current) {
        cursorRingRef.current.style.opacity = '1';
      }
    };

    const handleMouseLeave = () => {
      if (cursorDotRef.current) cursorDotRef.current.style.opacity = '0';
      if (cursorRingRef.current) cursorRingRef.current.style.opacity = '0';
    };

    const handleMouseEnter = () => {
      if (cursorDotRef.current) cursorDotRef.current.style.opacity = '1';
      if (cursorRingRef.current) cursorRingRef.current.style.opacity = '1';
    };

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      if (cursorRingRef.current) {
        cursorRingRef.current.style.left = `${ringX}px`;
        cursorRingRef.current.style.top = `${ringY}px`;
      }
      rafId = requestAnimationFrame(animateRing);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    rafId = requestAnimationFrame(animateRing);

    // Hover elements handler to scale cursor ring
    const addHoverClass = () => document.body.classList.add('cursor-hover');
    const removeHoverClass = () => document.body.classList.remove('cursor-hover');

    const updateHoverListeners = () => {
      const hoverables = document.querySelectorAll('a, button, .work-card, .skill-card, .testi-card');
      hoverables.forEach((el) => {
        el.removeEventListener('mouseenter', addHoverClass);
        el.removeEventListener('mouseleave', removeHoverClass);
        el.addEventListener('mouseenter', addHoverClass);
        el.addEventListener('mouseleave', removeHoverClass);
      });
    };

    // Run initially and set a short delay to cover rendered elements
    updateHoverListeners();
    const timer = setTimeout(updateHoverListeners, 100);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
      document.body.classList.remove('has-custom-cursor', 'cursor-hover');
    };
  }, []);

  useEffect(() => {
    // Scroll handling for Nav background blur
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 40);

      // Parallax on Deco rings
      const y = window.scrollY;
      const rings = document.querySelectorAll('.deco-ring');
      rings.forEach((ring, idx) => {
        const factor = idx === 0 ? 0.12 : 0.08;
        ring.style.transform = `translateY(${y * factor}px)`;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Intersection Observer for Scroll Reveals
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          } else {
            entry.target.classList.remove('visible');
          }
        });
      },
      { threshold: 0.12 }
    );

    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* CUSTOM CURSOR */}
      <div id="cursor-dot" ref={cursorDotRef}></div>
      <div id="cursor-ring" ref={cursorRingRef}></div>

      {/* LIGHTBOX */}
      {lightbox && (
        <Lightbox
          src={lightbox.src}
          title={lightbox.title}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* NAV */}
      <nav id="navbar" className={navScrolled ? 'scrolled' : ''}>
        <a href="#" className="nav-logo">Rio Facturan</a>
        <ul className="nav-links">
          <li><a href="#about">About</a></li>
          <li><a href="#work">Work</a></li>
          <li><a href="#skills">Skills</a></li>
          <li><a href="#process">Process</a></li>
          <li><a href="#applications">Apps</a></li>
        </ul>
        <a href="#contact" className="nav-cta">Let's Talk</a>
      </nav>

      {/* HERO */}
      <section id="hero">
        <div className="deco-ring"></div>
        <div className="deco-ring"></div>

        <p className="hero-tag"><span></span> Graphic Designer &amp; Brand Strategist</p>

        <h1 className="hero-heading">
          <span className="line"><span>Crafting</span></span>
          <span className="line"><span>Visual <em>Stories</em></span></span>
          <span className="line"><span>That Last.</span></span>
        </h1>

        <div className="hero-sub-row">
          <p className="hero-sub">
            I design with purpose — blending bold aesthetics with strategic thinking to build brands that resonate, communicate, and endure.
          </p>
          <div className="hero-actions">
            <a href="#work" className="btn-primary">
              View Work
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a href="#contact" className="btn-ghost">Get in touch</a>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          <span className="marquee-item">Brand Identity</span>
          <span className="marquee-item">Editorial Design</span>
          <span className="marquee-item">UI / UX Design</span>
          <span className="marquee-item">Typography</span>
          <span className="marquee-item">Packaging Design</span>
          <span className="marquee-item">Art Direction</span>
          <span className="marquee-item">Brand Identity</span>
          <span className="marquee-item">Editorial Design</span>
          <span className="marquee-item">UI / UX Design</span>
          <span className="marquee-item">Typography</span>
          <span className="marquee-item">Packaging Design</span>
          <span className="marquee-item">Art Direction</span>
        </div>
      </div>

      {/* ABOUT */}
      <section id="about">
        <div className="about-left reveal">
          <p className="section-label">About Me</p>
          <h2 className="section-title">Design is my language, creativity is my superpower.</h2>
          <p className="about-desc">Hi, I'm Rio — a passionate graphic designer whose journey began in college. I started as a layout artist, creating jerseys for intramural events and eSports tournaments, as well as designing logos, tarpaulins, and event banners for IT Days and other school activities. These experiences helped me develop a strong foundation in visual design, creativity, and attention to detail.

            Since then, I've continued to improve my skills in graphic design, creating clean, engaging, and impactful designs that effectively communicate ideas and meet client needs.
          </p>
          <div className="about-stats">
            <Counter target={3} suffix="+" label="Years Experience" />
            <Counter target={30} suffix="+" label="Projects Done" />
            <Counter target={30} suffix="+" label="Happy Clients" />
          </div>
        </div>
        <div className="about-right reveal reveal-delay-2">
          <div className="about-img-wrap">
            <img src="/about-me.jpg" alt="Rio Facturan" className="about-photo" />
            <div className="avail-badge">
              <div className="avail-dot"></div>
              Available for projects
            </div>
          </div>
        </div>
      </section>

      {/* SKILLS */}
      <section id="skills">
        <div className="skills-header">
          <div>
            <p className="section-label reveal">Expertise</p>
            <h2 className="section-title reveal reveal-delay-1">What I bring to the table</h2>
          </div>
        </div>
        <div className="skills-grid">
          <div className="skill-card reveal">
            <span className="skill-icon">&#9675;</span>
            <div className="skill-name">Brand Identity</div>
            <div className="skill-desc">From logo marks to complete visual systems — I craft identities that are memorable, scalable, and deeply meaningful.</div>
          </div>
          <div className="skill-card reveal reveal-delay-1">
            <span className="skill-icon">&#9638;</span>
            <div className="skill-name">Editorial Design</div>
            <div className="skill-desc">Magazine layouts, book design, and annual reports — clean grids, elegant typography, and compelling visual hierarchies.</div>
          </div>
          <div className="skill-card reveal reveal-delay-2">
            <span className="skill-icon">&#9672;</span>
            <div className="skill-name">UI / UX Design</div>
            <div className="skill-desc">Wireframes to high-fidelity prototypes. I design interfaces that are intuitive, accessible, and beautiful to use.</div>
          </div>
          <div className="skill-card reveal reveal-delay-3">
            <span className="skill-icon">&#11042;</span>
            <div className="skill-name">Art Direction</div>
            <div className="skill-desc">Creative vision for campaigns, shoots, and content — ensuring every visual element tells a cohesive story.</div>
          </div>

          <div className="skill-card reveal reveal-delay-1">
            <span className="skill-icon">&#9633;</span>
            <div className="skill-name">Packaging Design</div>
            <div className="skill-desc">From concept to shelf — packaging that stands out, communicates value, and converts browsers into buyers.</div>
          </div>
          <div className="skill-card reveal reveal-delay-2">
            <span className="skill-icon">&#10022;</span>
            <div className="skill-name">Typography</div>
            <div className="skill-desc">Custom lettering, type selection, and typographic systems — because type is the silent voice of every design.</div>
          </div>

        </div>
      </section>

      {/* WORK */}
      <section id="work">
        <div className="work-header">
          <div>
            <p className="section-label reveal">Portfolio</p>
            <h2 className="section-title reveal reveal-delay-1">Selected Works</h2>
          </div>
          <a href="#contact" className="btn-ghost reveal reveal-delay-2">All Projects &rarr;</a>
        </div>
        <div className="work-grid">
          <WorkCard
            title="Esport/Sport Jersey Layout"
            category="Layout Design · 2025"
            description="Developed custom jersey concepts for sports and esports teams, combining creativity with a professional look."
            imageUrl="/jersey.png"
            isLarge={true}
            fallbackChar="🎨"
            onImageClick={(src, title) => setLightbox({ src, title })}
          />
          <WorkCard
            title="FORM Magazine Redesign"
            category="Editorial Design · 2024"
            description="A full editorial redesign of an architecture &amp; design quarterly — new grid system, type hierarchy, and layout templates."
            imageUrl="/editorial-design.jpg"
            isLarge={false}
            fallbackChar="📰"
            onImageClick={(src, title) => setLightbox({ src, title })}
          />
          <WorkCard
            title="Infinity Pioneers - A3VERIFILE"
            category="UI / UX Design · 2026"
            description="End-to-end product design for a mindfulness application — research, wireframes, component library, and final UI."
            imageUrl="/ux-design.png"
            isLarge={false}
            fallbackChar="📱"
            onImageClick={(src, title) => setLightbox({ src, title })}
          />
          <WorkCard
            title="Tarpaulin Design"
            category="Layout Design · 2025"
            description="Designed high-quality tarpaulins that effectively communicate event information while maintaining a clean and professional look."
            imageUrl="/tarp.png"
            isLarge={false}
            fallbackChar="📦"
            onImageClick={(src, title) => setLightbox({ src, title })}
          />
          <WorkCard
            title="Logo Designs"
            category="Brand Identity · 2024"
            description="A collection of logos designed for various clients across different industries."
            imageUrl="/logos.png"
            isLarge={false}
            fallbackChar="✦"
            onImageClick={(src, title) => setLightbox({ src, title })}
          />
        </div>
      </section>

      {/* PROCESS */}
      <section id="process">
        <p className="section-label reveal">How I Work</p>
        <h2 className="section-title reveal reveal-delay-1">A process built on clarity &amp; craft.</h2>
        <div className="process-grid">
          <div className="process-step reveal">
            <div className="step-num">01</div>
            <div className="step-title">Discover</div>
            <p className="step-desc">Understanding your business, audience, and goals through in-depth discovery workshops and competitive analysis.</p>
          </div>
          <div className="process-step reveal reveal-delay-1">
            <div className="step-num">02</div>
            <div className="step-title">Define</div>
            <p className="step-desc">Translating insights into a clear creative brief — positioning, visual direction, and measurable success criteria.</p>
          </div>
          <div className="process-step reveal reveal-delay-2">
            <div className="step-num">03</div>
            <div className="step-title">Design</div>
            <p className="step-desc">Iterative concept exploration, prototyping, and refinement until the design feels both bold and inevitable.</p>
          </div>
          <div className="process-step reveal reveal-delay-3">
            <div className="step-num">04</div>
            <div className="step-title">Deliver</div>
            <p className="step-desc">Meticulous final files, guidelines, and handoff — plus ongoing support so your brand continues to thrive.</p>
          </div>
        </div>
      </section>
      {/* APPLICATIONS */}
      <section id="applications" style={{ padding: '80px 48px', background: 'var(--bg)' }}>
        <div className="skills-header">
          <div>
            <p className="section-label reveal">Toolkit</p>
            <h2 className="section-title reveal reveal-delay-1">Applications I use</h2>
          </div>
        </div>
        <div className="skills-grid" style={{ marginTop: '40px' }}>
          <div className="skill-card reveal">
            <span className="skill-icon" style={{ fontFamily: 'DM Serif Display', fontSize: '2.5rem', color: '#31a8ff' }}>Ps</span>
            <div className="skill-name">Adobe Photoshop</div>
            <div className="skill-desc">For advanced photo editing, digital compositing, and creating realistic product mockups.</div>
          </div>
          <div className="skill-card reveal reveal-delay-1">
            <span className="skill-icon" style={{ fontFamily: 'DM Serif Display', fontSize: '2.5rem', color: '#00c4cc' }}>Cv</span>
            <div className="skill-name">Canva</div>
            <div className="skill-desc">For quick layout arrangements, social media graphics, and accessible design templates.</div>
          </div>
          <div className="skill-card reveal reveal-delay-2">
            <span className="skill-icon" style={{ fontFamily: 'DM Serif Display', fontSize: '2.5rem', color: '#88f3b2' }}>Am</span>
            <div className="skill-name">Alight Motion</div>
            <div className="skill-desc">For mobile video editing, animations, and bringing visual layouts to life on the go.</div>
          </div>
        </div>
      </section>


      {/* CONTACT */}
      <section id="contact">
        <p className="section-label reveal">Get In Touch</p>
        <h2 className="contact-title reveal reveal-delay-1">Let's build something <em>beautiful</em> together.</h2>
        <p className="contact-sub reveal reveal-delay-2">Have a project in mind? I'd love to hear about it. Let's talk about how we can work together.</p>
        <div className="contact-links reveal reveal-delay-3">
          <a href="Email: facturanrio7@gmail.com" className="contact-email" id="emailBtn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            facturanrio7@gmail.com
          </a>
          <a href="#" className="social-link" id="linkedinBtn" onClick={(e) => e.preventDefault()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
              <circle cx="4" cy="4" r="2" />
            </svg>
            LinkedIn
          </a>
          <a href="#" className="social-link" id="behanceBtn" onClick={(e) => e.preventDefault()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 1.2.836 1.9 2.1 1.9.74 0 1.25-.3 1.656-.85l2 .98zM15.973 14h4.062c-.071-1.52-.934-2.28-1.96-2.28-1.12 0-1.86.81-2.102 2.28zM5.122 7.947h-3.12v10.027h3.14c1.67 0 4.466-.377 4.466-3.712 0-2.008-1.27-2.836-2.153-3.073.627-.278 1.96-1.148 1.96-2.738 0-3.388-3.012-2.504-4.293-2.504zm-.36 4.094H2.999V9.931h1.763c.859 0 1.43.598 1.43 1.055 0 .73-.601 1.055-1.43 1.055zm.208 3.559H2.999v-2.47h1.971c.964 0 1.73.51 1.73 1.274 0 .764-.766 1.196-1.73 1.196z" />
            </svg>
            Behance
          </a>
          <a href="#" className="social-link" id="dribbbleBtn" onClick={(e) => e.preventDefault()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32" />
            </svg>
            Dribbble
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <span className="footer-logo">Rio Facturan</span>
        <span>&copy; 2026 Rio Facturan. All rights reserved.</span>
        <span>P-2 Villaflor, Oroquieta City, Misamis Occidental</span>
      </footer>
    </>
  );
}

export default App;
