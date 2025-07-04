# Job Hawker

Job Hawker is a web application for listing job opportunities. It consists of three main components:

*   **Backend API (`jobhawker-api/`)**: A Laravel-based API that provides data to the frontend.
*   **Frontend (`jobhawker-frontend/`)**: A React-based single-page application that provides the user interface.
*   **Scraper (`jobhawker-scraper/`)**: A Python script that scrapes job listings from various sources.

## Getting Started

To get started with Job Hawker, you will need to set up each of the components individually.

### Backend API

The backend is a Laravel application. To get started, `cd` into the `jobhawker-api` directory and follow these steps:

1.  Install dependencies: `composer install`
2.  Create a `.env` file: `cp .env.example .env`
3.  Generate an application key: `php artisan key:generate`
4.  Run database migrations: `php artisan migrate`
5.  Start the development server: `php artisan serve`

### Frontend

The frontend is a React application. To get started, `cd` into the `jobhawker-frontend` directory and follow these steps:

1.  Install dependencies: `npm install`
2.  Start the development server: `npm start`

### Scraper

The scraper is a Python script. To get started, `cd` into the `jobhawker-scraper` directory and follow these steps:

1.  Create a virtual environment: `python -m venv venv`
2.  Activate the virtual environment: `source venv/bin/activate`
3.  Run the scraper: `python main.py`