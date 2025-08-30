import os
from dotenv import load_dotenv
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import requests
from datetime import datetime, timedelta
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# GNews API configuration
GNEWS_API_KEY = os.getenv('GNEWS_API_KEY')
GNEWS_BASE_URL = 'https://gnews.io/api/v4'

# Check if API key is available (without logging the actual key)
if not GNEWS_API_KEY:
    logger.error("GNEWS_API_KEY environment variable is not set!")
    logger.error("Please set your GNEWS_API_KEY environment variable")
    logger.error("You can get a free API key at https://gnews.io/")
else:
    logger.info("GNEWS_API_KEY is set and ready")

# Category mapping for GNews API
CATEGORY_MAPPING = {
    'all': 'general',
    'technology': 'technology',
    'business': 'business',
    'politics': 'nation',
    'sports': 'sports',
    'entertainment': 'entertainment',
    'health': 'health',
    'science': 'science'
}

# Language mapping for GNews API
LANGUAGE_MAPPING = {
    'en': 'en',
    'es': 'es',
    'fr': 'fr',
    'de': 'de',
    'it': 'it',
    'pt': 'pt'
}

# Country mapping for GNews API
COUNTRY_MAPPING = {
    'all': None,
    'us': 'us',
    'uk': 'gb',
    'ca': 'ca',
    'au': 'au',
    'de': 'de',
    'fr': 'fr',
    'jp': 'jp'
}

def get_date_from_range(date_range):
    """Convert date range to ISO format for GNews API.
    
    According to GNews API docs, the 'from' parameter filters articles with 
    publication date >= specified value in ISO 8601 format.
    """
    now = datetime.now()
    
    if date_range == 'today':
        # For today, get articles from start of current day
        from_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif date_range == 'week':
        # For this week, get articles from 7 days ago
        from_date = now - timedelta(days=7)
    elif date_range == 'month':
        # For this month, get articles from 30 days ago
        from_date = now - timedelta(days=30)
    elif date_range == 'year':
        # For this year, get articles from 365 days ago
        from_date = now - timedelta(days=365)
    else:
        return None
    
    # Return in ISO 8601 format as required by GNews API
    return from_date.isoformat() + 'Z'

def fetch_news_from_gnews(category='general', language='en', country=None, max_articles=10, from_date=None, search_query=None):
    # Fetch news from GNews API using the top-headlines endpoint.
    # This endpoint supports all our filters including search queries via the 'q' parameter.
    try:
        # Always use top-headlines endpoint as it supports all parameters
        url = f"{GNEWS_BASE_URL}/top-headlines"
        params = {
            'lang': language,
            'max': max_articles,
            'apikey': GNEWS_API_KEY
        }
        
        # Add category parameter (only if not searching by query)
        if not search_query and category:
            params['category'] = category
        
        # Add search query parameter
        if search_query:
            params['q'] = search_query
        
        # Add optional parameters
        if country:
            params['country'] = country
        if from_date:
            # GNews API 'from' parameter: articles with publication date >= from_date
            # Date must be in ISO 8601 format (e.g., 2025-01-15T00:00:00Z)
            params['from'] = from_date
        
        # Make the API request
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Transform the data to match our frontend format
        transformed_articles = []
        for i, article in enumerate(data.get('articles', [])):
            transformed_article = {
                'id': f"gnews_{i}_{article.get('publishedAt', '')}",
                'title': article.get('title', 'No Title'),
                'description': article.get('description', 'No description available'),
                'imageUrl': article.get('image', 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=250&fit=crop'),
                'category': category.title() if category != 'general' else 'General',
                'publishedAt': article.get('publishedAt', datetime.now().isoformat() + 'Z'),
                'readMoreUrl': article.get('url', '#'),
                'source': article.get('source', {}).get('name', 'Unknown Source'),
                'country': country or 'all',
                'language': language
            }
            transformed_articles.append(transformed_article)
        
        return {
            'success': True,
            'articles': transformed_articles,
            'total': data.get('totalArticles', len(transformed_articles))
        }
        
    except requests.exceptions.RequestException as e:
        logger.error(f"API request failed: {str(e)}")
        return {
            'success': False,
            'error': 'Failed to fetch news from API',
            'articles': []
        }
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {
            'success': False,
            'error': 'An unexpected error occurred',
            'articles': []
        }

@app.route('/')
def index():
    # Serve the main page.
    return render_template('index.html')

@app.route('/api/news')
def get_news():
    # API endpoint to fetch news based on filters.
    try:
        # Get filter parameters
        topic = request.args.get('topic', 'all')
        language = request.args.get('language', 'en')
        country = request.args.get('country', 'all')
        date_range = request.args.get('dateRange', 'week')
        search_query = request.args.get('q', None)
        max_articles = min(int(request.args.get('max', 10)), 100)  # Limit to 100 as per API
        
        # Map frontend values to GNews API values
        gnews_category = CATEGORY_MAPPING.get(topic, 'general')
        gnews_language = LANGUAGE_MAPPING.get(language, 'en')
        gnews_country = COUNTRY_MAPPING.get(country)
        from_date = get_date_from_range(date_range)
        
        # Log the date range being used
        if from_date:
            logger.info(f"Fetching news: category={gnews_category}, lang={gnews_language}, country={gnews_country}, from={from_date}")
        else:
            logger.info(f"Fetching news: category={gnews_category}, lang={gnews_language}, country={gnews_country}, no date filter")
        
        # Fetch news from GNews API
        result = fetch_news_from_gnews(
            category=gnews_category,
            language=gnews_language,
            country=gnews_country,
            max_articles=max_articles,
            from_date=from_date,
            search_query=search_query
        )
        
        if result['success']:
            return jsonify({
                'success': True,
                'articles': result['articles'],
                'total': result['total']
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error'],
                'articles': []
            }), 500
            
    except Exception as e:
        logger.error(f"Error in get_news endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'articles': []
        }), 500

@app.route('/api/search')
def search_news():
    # API endpoint to search news.
    try:
        query = request.args.get('q', '')
        if not query:
            return jsonify({
                'success': False,
                'error': 'Search query is required',
                'articles': []
            }), 400
        
        language = request.args.get('language', 'en')
        country = request.args.get('country', 'all')
        date_range = request.args.get('dateRange', 'week')
        max_articles = min(int(request.args.get('max', 10)), 100)
        
        gnews_language = LANGUAGE_MAPPING.get(language, 'en')
        gnews_country = COUNTRY_MAPPING.get(country)
        from_date = get_date_from_range(date_range)
        
        # Log the search parameters including date filter
        if from_date:
            logger.info(f"Searching news: query='{query}', lang={gnews_language}, country={gnews_country}, from={from_date}")
        else:
            logger.info(f"Searching news: query='{query}', lang={gnews_language}, country={gnews_country}, no date filter")
        
        result = fetch_news_from_gnews(
            language=gnews_language,
            country=gnews_country,
            max_articles=max_articles,
            from_date=from_date,
            search_query=query
        )
        
        if result['success']:
            return jsonify({
                'success': True,
                'articles': result['articles'],
                'total': result['total']
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error'],
                'articles': []
            }), 500
            
    except Exception as e:
        logger.error(f"Error in search_news endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'articles': []
        }), 500

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Check if API key is set
    if not GNEWS_API_KEY:
        logger.error("Cannot start application without GNEWS_API_KEY")
        exit(1)
    
    # Production configuration
    debug_mode = os.getenv('FLASK_ENV') == 'development'
    port = int(os.getenv('PORT', 5000))
    
    app.run(debug=debug_mode, host='0.0.0.0', port=port)