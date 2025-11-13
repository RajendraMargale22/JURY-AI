import React from 'react';
import './LegalFacts.css';

const legalFactsData = [
  {
    icon: 'fas fa-balance-scale',
    title: 'Constitution of India',
    text: 'The Indian Constitution is the longest written constitution in the world, with 395 articles and 12 schedules.',
  },
  {
    icon: 'fas fa-gavel',
    title: 'Supreme Court',
    text: 'The Supreme Court of India was established on January 26, 1950, and is the highest judicial authority in the country.',
  },
  {
    icon: 'fas fa-landmark',
    title: 'High Courts',
    text: 'India has 25 High Courts, with the Calcutta High Court being the oldest, established in 1862.',
  },
  {
    icon: 'fas fa-book-reader',
    title: 'Legal System',
    text: 'India follows a common law system based on recorded judicial precedents, inherited from the British legal system.',
  },
];

const LegalFacts: React.FC = () => {
  return (
    <section className="legal-facts-section">
      <div className="container">
        <div className="row text-center mb-5">
          <div className="col-12">
            <h2 className="display-5 fw-bold">Did You Know? Legal Facts</h2>
          </div>
        </div>
        <div className="row g-4">
          {legalFactsData.map((fact, index) => (
            <div className="col-md-6" key={index}>
              <div className="fact-card">
                <div className="d-flex align-items-start">
                  <i className={`fact-icon ${fact.icon} me-4`}></i>
                  <div>
                    <h5 className="fact-card-title">{fact.title}</h5>
                    <p className="fact-card-text">{fact.text}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LegalFacts;
