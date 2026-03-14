import React, { useState, useEffect, useRef } from 'react';
import './LegalFacts.css';

const legalFactsData = [
  {
    icon: 'fas fa-balance-scale',
    title: 'Constitution of India',
    text: 'The Indian Constitution is the longest written constitution in the world, with 395 articles and 12 schedules.',
    color: '#5dd0ff',
  },
  {
    icon: 'fas fa-gavel',
    title: 'Supreme Court',
    text: 'The Supreme Court of India was established on January 26, 1950, and is the highest judicial authority in the country.',
    color: '#7c5dff',
  },
  {
    icon: 'fas fa-landmark',
    title: 'High Courts',
    text: 'India has 25 High Courts, with the Calcutta High Court being the oldest, established in 1862.',
    color: '#ff9f7c',
  },
  {
    icon: 'fas fa-book-reader',
    title: 'Legal System',
    text: 'India follows a common law system based on recorded judicial precedents, inherited from the British legal system.',
    color: '#2dd4bf',
  },
  {
    icon: 'fas fa-university',
    title: 'Fundamental Rights',
    text: 'The Constitution guarantees six fundamental rights to Indian citizens, including the right to equality and freedom.',
    color: '#f59e0b',
  },
  {
    icon: 'fas fa-file-contract',
    title: 'Contract Law',
    text: 'The Indian Contract Act, 1872, governs contracts in India and is based on English common law principles.',
    color: '#ec4899',
  },
];

const LegalFacts: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % legalFactsData.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % legalFactsData.length);
  };

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + legalFactsData.length) % legalFactsData.length);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  return (
    <section className="legal-facts-section">
      <div className="container">
        <div className="text-center mb-5">
          <div
            style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: 20,
              background: 'rgba(93,208,255,0.1)',
              border: '1px solid rgba(93,208,255,0.2)',
              color: '#5dd0ff',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 16,
            }}
          >
            Legal Knowledge
          </div>
          <h2 className="fw-bold mb-3" style={{ color: '#fff', fontSize: '2.2rem' }}>
            Did You Know? Legal Facts
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 540, margin: '0 auto', fontSize: 16 }}>
            Discover interesting facts about Indian legal system
          </p>
        </div>

        {/* Carousel Container */}
        <div className="facts-carousel-container" ref={containerRef}>
          <button className="carousel-btn carousel-btn-prev" onClick={handlePrev} aria-label="Previous">
            <i className="fas fa-chevron-left"></i>
          </button>

          <div className="facts-carousel-track">
            {legalFactsData.map((fact, index) => {
              const offset = index - currentIndex;
              const isActive = index === currentIndex;
              
              return (
                <div
                  key={index}
                  className={`fact-card-carousel ${isActive ? 'active' : ''}`}
                  style={{
                    transform: `translateX(${offset * 110}%) scale(${isActive ? 1 : 0.85})`,
                    opacity: Math.abs(offset) > 1 ? 0 : isActive ? 1 : 0.4,
                    zIndex: isActive ? 10 : 1,
                  }}
                >
                  <div className="fact-card-inner">
                    <div
                      className="fact-icon-container"
                      style={{ background: `${fact.color}15`, border: `2px solid ${fact.color}40` }}
                    >
                      <i className={fact.icon} style={{ color: fact.color }}></i>
                    </div>
                    <h5 className="fact-card-title">{fact.title}</h5>
                    <p className="fact-card-text">{fact.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="carousel-btn carousel-btn-next" onClick={handleNext} aria-label="Next">
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="carousel-dots">
          {legalFactsData.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Auto-play toggle */}
        <div className="text-center mt-3">
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.5)',
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <i className={`fas fa-${isAutoPlaying ? 'pause' : 'play'} me-2`}></i>
            {isAutoPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default LegalFacts;
