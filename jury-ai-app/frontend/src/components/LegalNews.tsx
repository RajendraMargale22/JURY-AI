import React, { useState, useEffect } from 'react';
import './LegalNews.css';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

const LegalNews: React.FC = () => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLegalNews();
  }, []);

  const fetchLegalNews = async () => {
    try {
      // Using NewsAPI.org - Free tier allows 100 requests per day
      // You can get a free API key from https://newsapi.org/
      const apiKey = 'AIzaSyDh0TWKg0e88ATvammg2xFyEMrabiHCmNw'
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=(law OR legal OR court OR justice OR attorney)&sortBy=publishedAt&language=en&pageSize=6&apiKey=${apiKey}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setNews(data.articles || []);
      } else {
        // Fallback to static news if API fails
        setNews([
          {
            title: 'Criminal Procedure Code Amendment 2025',
            description: 'New provisions introduced in CrPC for faster trial proceedings and digital evidence.',
            url: '#',
            urlToImage: 'https://placehold.co/400x200.png?text=Legal+News',
            publishedAt: '2025-03-01',
            source: { name: 'Legal Updates' }
          },
          {
            title: "Green Tribunal's New Environmental Norms",
            description: 'National Green Tribunal issues stricter guidelines for environmental clearances and compliance.',
            url: '#',
            urlToImage: 'https://placehold.co/400x200.png?text=Legal+News',
            publishedAt: '2025-03-02',
            source: { name: 'Legal Updates' }
          },
          {
            title: 'Uniform Civil Code Discussion in Parliament',
            description: 'Parliamentary committee begins discussions on implementing Uniform Civil Code across the nation.',
            url: '#',
            urlToImage: 'https://placehold.co/400x200.png?text=Legal+News',
            publishedAt: '2025-03-03',
            source: { name: 'Legal Updates' }
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      // Set fallback news
      setNews([
        {
          title: 'Latest Legal Updates Available',
          description: 'Stay informed with the latest news in law and justice.',
          url: '#',
          urlToImage: 'https://placehold.co/400x200.png?text=Legal+News',
          publishedAt: new Date().toISOString(),
          source: { name: 'Legal Updates' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <section className="legal-news-section">
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border" style={{color: '#5dd0ff'}} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="legal-news-section">
      <div className="container">
        <div className="row text-center mb-5">
          <div className="col-12">
            <h2 className="display-5 fw-bold">Latest Legal News & Updates</h2>
          </div>
        </div>
        <div className="row g-4">
          {news.slice(0, 6).map((article, index) => (
            <div className="col-md-6 col-lg-4" key={index}>
              <div className="news-card">
                <div className="news-card-header">
                  <div className="news-icon">
                    <i className="fas fa-gavel"></i>
                  </div>
                </div>
                <div className="news-card-body">
                  <div className="news-source mb-2">
                    <span className="badge" style={{
                      background: 'rgba(93, 208, 255, 0.15)',
                      color: '#5dd0ff',
                      fontSize: '0.75rem'
                    }}>
                      {article.source.name}
                    </span>
                  </div>
                  <h5 className="news-card-title">{article.title}</h5>
                  <p className="news-card-text">
                    {article.description?.substring(0, 120) || 'Click to read more about this legal update.'}...
                  </p>
                  <div className="news-card-footer">
                    <span className="news-date">
                      <i className="fas fa-calendar-alt me-2"></i>
                      {formatDate(article.publishedAt)}
                    </span>
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="read-more-link">
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
