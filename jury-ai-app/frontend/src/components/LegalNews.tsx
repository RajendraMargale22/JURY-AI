import React from 'react';
import './LegalNews.css';

const legalNewsData = [
  {
    imgSrc: 'https://placehold.co/400x200.png?text=Legal+Image+1',
    title: 'Criminal Procedure Code Amendment 2025',
    description: 'New provisions introduced in CrPC for faster trial proceedings and digital evidence.',
    date: 'Sept 3, 2025',
    link: '#',
  },
  {
    imgSrc: 'https://placehold.co/400x200.png?text=Legal+Image+2',
    title: "Green Tribunal's New Environmental Norms",
    description: 'National Green Tribunal issues stricter guidelines for environmental clearances and compliance.',
    date: 'Sept 2, 2025',
    link: '#',
  },
  {
    imgSrc: 'https://placehold.co/400x200.png?text=Family+Law',
    title: 'Uniform Civil Code Discussion in Parliament',
    description: 'Parliamentary committee begins discussions on implementing Uniform Civil Code across the nation.',
    date: 'Sept 1, 2025',
    link: '#',
  },
];

const LegalNews: React.FC = () => {
  return (
    <section className="legal-news-section">
      <div className="container">
        <div className="row text-center mb-5">
          <div className="col-12">
            <h2 className="display-5 fw-bold">Latest Legal News & Updates</h2>
          </div>
        </div>
        <div className="row g-4">
          {legalNewsData.map((news, index) => (
            <div className="col-md-6 col-lg-4" key={index}>
              <div className="news-card">
                <img src={news.imgSrc} alt={news.title} className="news-card-img" />
                <div className="news-card-body">
                  <h5 className="news-card-title">{news.title}</h5>
                  <p className="news-card-text">{news.description}</p>
                  <div className="news-card-footer">
                    <span className="news-date">
                      <i className="fas fa-calendar-alt me-2"></i>
                      {news.date}
                    </span>
                    <a href={news.link} className="read-more-link">
                      Read More <i className="fas fa-arrow-right ms-1"></i>
                    </a>
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

export default LegalNews;
