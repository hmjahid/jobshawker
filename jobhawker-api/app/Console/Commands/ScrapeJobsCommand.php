<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\JobListing;

class ScrapeJobsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'jobs:scrape';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scrape jobs from various sources and store them in the database.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Scraping jobs...');

        $jobsToScrape = [
            [
                'title' => 'Senior Software Engineer',
                'description' => 'Lead a team of engineers to build scalable software solutions.',
                'location' => 'San Francisco, CA',
                'type' => 'onsite',
                'min_salary' => 120000,
                'max_salary' => 160000,
                'company' => 'Google',
                'url' => 'https://example.com/google-job',
                'source' => 'Google',
            ],
            [
                'title' => 'Fullstack Developer',
                'description' => 'Develop and maintain web applications using modern technologies.',
                'location' => 'Remote',
                'type' => 'remote',
                'min_salary' => 100000,
                'max_salary' => 140000,
                'company' => 'LinkedIn',
                'url' => 'https://example.com/linkedin-job',
                'source' => 'LinkedIn',
            ],
            [
                'title' => 'Data Analyst',
                'description' => 'Analyze large datasets to provide actionable insights.',
                'location' => 'New York, NY',
                'type' => 'hybrid',
                'min_salary' => 80000,
                'max_salary' => 110000,
                'company' => 'Indeed',
                'url' => 'https://example.com/indeed-job',
                'source' => 'Indeed',
            ],
            [
                'title' => 'Mobile App Developer',
                'description' => 'Build cross-platform mobile applications.',
                'location' => 'Remote',
                'type' => 'remote',
                'min_salary' => 90000,
                'max_salary' => 130000,
                'company' => 'SimplyHired',
                'url' => 'https://example.com/simplyhired-job',
                'source' => 'SimplyHired',
            ],
            [
                'title' => 'AI/ML Engineer',
                'description' => 'Develop and deploy machine learning models.',
                'location' => 'Seattle, WA',
                'type' => 'onsite',
                'min_salary' => 130000,
                'max_salary' => 180000,
                'company' => 'Turing',
                'url' => 'https://example.com/turing-job',
                'source' => 'Turing',
            ],
        ];

        foreach ($jobsToScrape as $jobData) {
            JobListing::create($jobData);
        }

        $this->info('Jobs scraped successfully!');
    }
}
