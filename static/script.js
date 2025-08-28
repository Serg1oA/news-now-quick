// Current filters
let currentFilters = {
    topic: "all",
    language: "en",
    country: "all",
    dateRange: "week",
    keywords: ""
};

// DOM elements
const newsGrid = document.getElementById('newsGrid');
const loadingGrid = document.getElementById('loadingGrid');
const noResults = document.getElementById('noResults');
const articleCount = document.getElementById('articleCount');
const applyFiltersBtn = document.getElementById('applyFilters');
const errorMessage = document.getElementById('errorMessage');
const newsTitle = document.getElementById('newsTitle');

// Filter elements
const topicSelect = document.getElementById('topic');
const languageSelect = document.getElementById('language');
const countrySelect = document.getElementById('country');
const dateRangeSelect = document.getElementById('dateRange');
const keywordsInput = document.getElementById('keywords');

// API base URL
const API_BASE_URL = window.location.origin;

// Format date helper
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
        return "Just now";
    } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    }
}

// Create news card HTML
function createNewsCard(news) {
    return `
        <div class="news-card">
            <img src="${news.imageUrl}" alt="${news.title}" class="news-image" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=250&fit=crop'">
            <div class="news-content">
                <div class="news-meta">
                    <span class="category-badge">${news.category}</span>
                    <div class="time-info">
                        <svg class="clock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12,6 12,12 16,14"></polyline>
                        </svg>
                        <span>${formatDate(news.publishedAt)}</span>
                    </div>
                </div>
                
                <h3 class="news-title">${news.title}</h3>
                
                <p class="news-description">${news.description}</p>
                
                <div class="news-footer">
                    <span class="news-source">${news.source}</span>
                    <button class="read-more-btn" onclick="window.open('${news.readMoreUrl}', '_blank')">
                        Read more
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Hide error message
function hideError() {
    errorMessage.style.display = 'none';
}

// Fetch news from API
async function fetchNews(params = {}) {
    try {
        const urlParams = new URLSearchParams(params);
        const endpoint = params.q ? '/api/search' : '/api/news';
        const fullUrl = `${API_BASE_URL}${endpoint}?${urlParams}`;
        
        console.log('Fetching from:', fullUrl);
        console.log('Parameters:', params);
        
        const response = await fetch(fullUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch news');
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching news:', error);
        throw error;
    }
}

// Render news
function renderNews(articles) {
    console.log('Rendering news:', articles);
    hideError();
    
    if (articles.length === 0) {
        console.log('No articles to display');
        newsGrid.style.display = 'none';
        noResults.style.display = 'block';
        articleCount.textContent = '0';
        return;
    }

    console.log(`Displaying ${articles.length} articles`);
    newsGrid.style.display = 'grid';
    noResults.style.display = 'none';
    newsGrid.innerHTML = articles.map(createNewsCard).join('');
    articleCount.textContent = articles.length;
}

// Show loading state
function showLoading() {
    newsGrid.style.display = 'none';
    noResults.style.display = 'none';
    loadingGrid.style.display = 'grid';
    hideError();
}

// Hide loading state
function hideLoading() {
    loadingGrid.style.display = 'none';
}

// Generate descriptive article count text
function updateArticleCountDescription() {
    const category = currentFilters.topic === 'all' ? '' : currentFilters.topic;
    const country = currentFilters.country === 'all' ? 'worldwide' : `in ${getCountryName(currentFilters.country)}`;
    const dateRange = getDateRangeDescription(currentFilters.dateRange);
    const language = getLanguageName(currentFilters.language);
    const keywords = currentFilters.keywords ? ` containing the keywords "${currentFilters.keywords}"` : '';
    
    const description = `Trending ${category} news ${country} released within ${dateRange}, written in ${language}${keywords}.`;
    
    // Update the article count element
    const articleCountElement = document.querySelector('.news-count');
    if (articleCountElement) {
        articleCountElement.innerHTML = `<span id="articleCount">➤</span> ${description}`;
    }
}

// Helper function to get country names
function getCountryName(countryCode) {
    const countryNames = {
        'us': 'United States',
        'uk': 'United Kingdom',
        'ca': 'Canada',
        'au': 'Australia',
        'de': 'Germany',
        'fr': 'France',
        'jp': 'Japan'
    };
    return countryNames[countryCode] || countryCode.toUpperCase();
}

// Helper function to get language names
function getLanguageName(languageCode) {
    const languageNames = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese'
    };
    return languageNames[languageCode] || languageCode.toUpperCase();
}

// Helper function to get date range descriptions
function getDateRangeDescription(dateRange) {
    const dateDescriptions = {
        'today': 'today',
        'week': 'the last 7 days',
        'month': 'the last 30 days',
        'year': 'the last 365 days'
    };
    return dateDescriptions[dateRange] || dateRange;
}

// Apply filters and fetch news
async function applyFilters() {
    // Update current filters from form
    currentFilters.topic = topicSelect.value;
    currentFilters.language = languageSelect.value;
    currentFilters.country = countrySelect.value;
    currentFilters.dateRange = dateRangeSelect.value;
    currentFilters.keywords = keywordsInput.value.trim();

    // Show loading
    showLoading();

    try {
        const params = {
            language: currentFilters.language,
            max: 9 // 10 is the maximum allowed by the API, but 9 makes the grid look better on large screens
        };

        // Add keywords for search if provided
        if (currentFilters.keywords) {
            params.q = currentFilters.keywords;
            // When searching, also include date and country filters
            params.dateRange = currentFilters.dateRange;
            params.country = currentFilters.country;
            newsTitle.textContent = `Search Results for "${currentFilters.keywords}"`;
        } else {
            // Regular filters for top headlines
            params.topic = currentFilters.topic;
            params.country = currentFilters.country;
            params.dateRange = currentFilters.dateRange;
            newsTitle.textContent = 'Trending News';
        }

        // Update article count description
        updateArticleCountDescription();

        const data = await fetchNews(params);
        hideLoading();
        renderNews(data.articles);
        
    } catch (error) {
        hideLoading();
        showError('Failed to load news. Please try again later.');
        renderNews([]);
    }
}

// Event listeners
applyFiltersBtn.addEventListener('click', applyFilters);

// Allow Enter key in keywords field
keywordsInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        applyFilters();
    }
});

// Auto-apply filters on select change
topicSelect.addEventListener('change', () => {
    currentFilters.topic = topicSelect.value;
});

languageSelect.addEventListener('change', () => {
    currentFilters.language = languageSelect.value;
});

countrySelect.addEventListener('change', () => {
    currentFilters.country = countrySelect.value;
});

dateRangeSelect.addEventListener('change', () => {
    currentFilters.dateRange = dateRangeSelect.value;
});

keywordsInput.addEventListener('input', () => {
    currentFilters.keywords = keywordsInput.value.trim();
});

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Set initial values
    topicSelect.value = currentFilters.topic;
    languageSelect.value = currentFilters.language;
    countrySelect.value = currentFilters.country;
    dateRangeSelect.value = currentFilters.dateRange;
    keywordsInput.value = currentFilters.keywords;

    // Load initial news
    applyFilters();
});

// Add interactive effects
document.addEventListener('DOMContentLoaded', () => {
    // Add focus effects to form elements only (not labels)
    const formElements = document.querySelectorAll('.filter-select, .filter-input');
    formElements.forEach(element => {
        element.addEventListener('focus', () => {
            element.style.borderColor = 'var(--primary-gold)';
            element.style.boxShadow = '0 0 0 3px rgba(255, 197, 6, 0.2)';
        });
        
        element.addEventListener('blur', () => {
            element.style.borderColor = 'var(--border-color)';
            element.style.boxShadow = 'none';
        });
    });
});