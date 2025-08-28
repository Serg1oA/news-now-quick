# News Now Quick - Golden Edition

A modern, responsive news aggregator built with Flask and vanilla JavaScript that fetches real-time news from GNews API.

## Features

- 🚀 Real-time news from GNews API
- 🎨 Beautiful dark theme with gold accents
- 🔍 Advanced filtering (category, language, country, date range)
- 📱 Fully responsive design
- ⚡ Fast and lightweight
- 🌍 Multi-language support
- 🗺️ Multi-country news sources

## Tech Stack

- **Backend**: Flask (Python)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **API**: GNews API
- **Deployment**: Render-ready

## Setup

### Prerequisites

- Python 3.9+
- GNews API key (free at [gnews.io](https://gnews.io/))

### Local Development

1. Clone the repository:
```bash
git clone <your-repo-url>
cd news-now-quick
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file:
```bash
cp env.example .env
# Edit .env and add your GNEWS_API_KEY
```

5. Run the application:
```bash
python app.py
```

The app will be available at `http://localhost:5000`

## Deployment to Render

### Option 1: Using render.yaml (Recommended)

1. Push your code to GitHub
2. Connect your repository to Render
3. Render will automatically detect the `render.yaml` file
4. Set the `GNEWS_API_KEY` environment variable in Render dashboard
5. Deploy!

### Option 2: Manual Setup

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `gunicorn app:app`
5. Add environment variable: `GNEWS_API_KEY`
6. Deploy!

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GNEWS_API_KEY` | Your GNews API key | Yes |
| `FLASK_ENV` | Flask environment (production/development) | No |
| `PORT` | Port to run the application on | No |

## API Endpoints

- `GET /` - Main page
- `GET /api/news` - Get news with filters
- `GET /api/search` - Search news by keywords

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues:
1. Check the logs in Render dashboard
2. Verify your GNews API key is correct
3. Ensure all environment variables are set
4. Check the GNews API status at [gnews.io](https://gnews.io/)