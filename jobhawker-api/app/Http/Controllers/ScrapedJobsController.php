<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Services\CareerjetAPI;

class ScrapedJobsController extends Controller
{
    private $careerjetAPI;

    public function __construct()
    {
        require_once base_path('vendor/careerjet/Careerjet_API.php');
        $this->careerjetAPI = new CareerjetAPI();
    }

    public function index(Request $request)
    {
        $keyword = $request->get('keyword', '');
        $type = $request->get('type', '');
        $minSalary = $request->get('min_salary');
        $maxSalary = $request->get('max_salary');
        $source = $request->get('source', 'all');
        $location = $request->get('location', '');
        $page = (int) $request->get('page', 1);
        $perPage = (int) $request->get('per_page', 10);
        $sort = $request->get('sort', 'latest');
        
        \Log::info('ScrapedJobsController called with params:', [
            'keyword' => $keyword,
            'type' => $type,
            'source' => $source,
            'location' => $location,
            'page' => $page,
            'per_page' => $perPage
        ]);
        
        $sources = array_map('trim', explode(',', strtolower($source)));
        $allJobs = [];
        $totalJobs = 0;
        $jobsBySource = [];
        $totalsBySource = [];

        // For each source, fetch paginated jobs if supported, else fetch all and slice
        if (in_array('remotive', $sources) || in_array('all', $sources)) {
            $remotiveResult = $this->getRemotiveJobs($keyword, $location, $page, $perPage);
            $jobsBySource['remotive'] = $remotiveResult['jobs'];
            $totalsBySource['remotive'] = $remotiveResult['total'];
        }
        if (in_array('themuse', $sources) || in_array('all', $sources)) {
            $museResult = $this->getTheMuseJobs($keyword, $location, $page, $perPage);
            $jobsBySource['themuse'] = $museResult['jobs'];
            $totalsBySource['themuse'] = $museResult['total'];
        }
        if (in_array('careerjet', $sources) || in_array('all', $sources)) {
            $careerjetResult = $this->careerjetAPI->searchJobs([
                'keyword' => $keyword,
                'location' => $location,
                'type' => $type,
                'min_salary' => $minSalary,
                'max_salary' => $maxSalary,
                'pagesize' => $perPage,
                'page' => $page
            ]);
            $jobsBySource['careerjet'] = $careerjetResult['jobs'] ?? [];
            $totalsBySource['careerjet'] = $careerjetResult['total'] ?? 0;
        }
        // For sources that do not support pagination, fetch all and slice
        if (in_array('arbeitnow', $sources) || in_array('all', $sources)) {
            $arbeitnowJobs = $this->getArbeitnowJobs($keyword, $location);
            $jobsBySource['arbeitnow'] = array_slice($arbeitnowJobs, ($page-1)*$perPage, $perPage);
            $totalsBySource['arbeitnow'] = count($arbeitnowJobs);
        }
        if (in_array('remoteok', $sources) || in_array('all', $sources)) {
            $remoteokJobs = $this->getRemoteOKJobs($keyword, $location);
            $jobsBySource['remoteok'] = array_slice($remoteokJobs, ($page-1)*$perPage, $perPage);
            $totalsBySource['remoteok'] = count($remoteokJobs);
        }
        if (in_array('jobicy', $sources) || in_array('all', $sources)) {
            $jobicyJobs = $this->getJobicyJobs($keyword, $location);
            $jobsBySource['jobicy'] = array_slice($jobicyJobs, ($page-1)*$perPage, $perPage);
            $totalsBySource['jobicy'] = count($jobicyJobs);
        }
        if ((in_array('openskills', $sources) || in_array('all', $sources)) && !empty($keyword)) {
            $openskillsJobs = $this->getOpenSkillsJobs($keyword);
            $jobsBySource['openskills'] = array_slice($openskillsJobs, ($page-1)*$perPage, $perPage);
            $totalsBySource['openskills'] = count($openskillsJobs);
        }
        // --- Refactored aggregation, normalization, filtering, and pagination ---
        // 1. Merge all jobs from all sources (multi-source or 'all')
        if (in_array('all', $sources) || count($sources) > 1) {
            $allJobs = [];
            foreach ($jobsBySource as $src => $jobs) {
                $allJobs = array_merge($allJobs, $jobs);
            }
        } else {
            // Single source
            $src = $sources[0];
            $allJobs = $jobsBySource[$src] ?? [];
        }
        // 2. Normalize work_type for all jobs
        foreach ($allJobs as &$job) {
            $typeLower = strtolower($job['type'] ?? '');
            $location = strtolower($job['location'] ?? '');
            $desc = strtolower($job['description'] ?? '');
            if (isset($job['work_type']) && in_array($job['work_type'], ['remote', 'onsite', 'hybrid'])) {
                continue;
            } elseif (strpos($typeLower, 'remote') !== false || strpos($location, 'remote') !== false || strpos($desc, 'remote') !== false) {
                $job['work_type'] = 'remote';
            } elseif (strpos($typeLower, 'hybrid') !== false || strpos($location, 'hybrid') !== false || strpos($desc, 'hybrid') !== false) {
                $job['work_type'] = 'hybrid';
            } elseif ($location && $location !== 'remote') {
                $job['work_type'] = 'onsite';
            } else {
                $job['work_type'] = '';
            }
        }
        unset($job);
        // 3. Filter by work_type if type filter is set
        if ($type) {
            $allJobs = array_filter($allJobs, function($job) use ($type) {
                return isset($job['work_type']) && strtolower($job['work_type']) === strtolower($type);
            });
            $allJobs = array_values($allJobs); // reindex
        }
        // 4. Set total to filtered count
        $totalJobs = count($allJobs);
        // 5. Sort jobs
        if ($sort === 'oldest') {
            usort($allJobs, function($a, $b) {
                return strtotime($a['date']) - strtotime($b['date']);
            });
        } else {
            usort($allJobs, function($a, $b) {
                return strtotime($b['date']) - strtotime($a['date']);
            });
        }
        // 6. Slice for pagination
        $allJobs = array_slice($allJobs, 0, $perPage);
        // --- End refactor ---
        
        \Log::info('Returning jobs:', ['count' => count($allJobs), 'total' => $totalJobs]);
        return response()->json(['jobs' => array_values($allJobs), 'total' => $totalJobs]);
    }

    private function salaryInRange($salaryStr, $minSalary, $maxSalary)
    {
        if (empty($salaryStr)) return true;
        
        try {
            preg_match_all('/\d[\d,]*/', $salaryStr, $matches);
            if (empty($matches[0])) return true;
            
            $numbers = array_map(function($num) {
                return (int) str_replace(',', '', $num);
            }, $matches[0]);
            
            $minSal = min($numbers);
            $maxSal = max($numbers);
            
            if ($minSalary && $minSal < $minSalary) return false;
            if ($maxSalary && $maxSal > $maxSalary) return false;
            
            return true;
        } catch (\Exception $e) {
            return true; // If we can't parse salary, include the job
        }
    }

    private function getJSearchJobs($keyword, $location, $type)
    {
        $apiKey = env('JSEARCH_RAPIDAPI_KEY'); // Add your key to .env
        $url = 'https://jsearch.p.rapidapi.com/estimated-salary';

        $query = [
            'job_title' => $keyword ?: 'developer',
            'location' => $location ?: 'anywhere',
            'location_type' => $type ? strtoupper($type) : 'ANY',
            'years_of_experience' => 'ALL'
        ];

        $response = \Http::withHeaders([
            'x-rapidapi-host' => 'jsearch.p.rapidapi.com',
            'x-rapidapi-key' => $apiKey,
        ])->get($url, $query);

        if ($response->successful()) {
            $data = $response->json();
            $jobs = [];
            foreach ($data['data'] ?? [] as $item) {
                $jobs[] = [
                    'title' => $item['job_title'] ?? '',
                    'company' => $item['employer_name'] ?? '',
                    'location' => $item['job_city'] ?? '',
                    'salary' => $item['estimated_salary'] ?? '',
                    'type' => $item['job_employment_type'] ?? '',
                    'work_type' => (isset($item['job_is_remote']) && $item['job_is_remote']) ? 'remote' : '',
                    'url' => $item['job_apply_link'] ?? '',
                    'source' => 'jsearch',
                    'description' => $item['job_description'] ?? '',
                    'date' => $item['job_posted_at_datetime_utc'] ?? '',
                    'site' => 'JSearch'
                ];
            }
            return $jobs;
        }
        return [];
    }

    /**
     * Fetch jobs from Indeed Scraper RapidAPI
     */
    public function getIndeedJobs(Request $request)
    {
        $apiKey = env('INDEED_RAPIDAPI_KEY', '');
        $url = 'https://indeed-scraper-api.p.rapidapi.com/api/job';

        $scraper = [
            'maxRows' => $request->input('maxRows', 15),
            'query' => $request->input('query', 'Developer'),
            'location' => $request->input('location', 'San Francisco'),
            'jobType' => $request->input('jobType', 'fulltime'),
            'radius' => $request->input('radius', '50'),
            'sort' => $request->input('sort', 'relevance'),
            'fromDays' => $request->input('fromDays', '7'),
            'country' => $request->input('country', 'us'),
        ];

        try {
            $response = \Http::withHeaders([
                'x-rapidapi-host' => 'indeed-scraper-api.p.rapidapi.com',
                'x-rapidapi-key' => $apiKey,
                'Content-Type' => 'application/json',
            ])->post($url, [
                'scraper' => $scraper
            ]);

            if ($response->successful()) {
                return response()->json($response->json());
            } else {
                return response()->json([
                    'error' => 'Failed to fetch Indeed jobs',
                    'details' => $response->body()
                ], $response->status());
            }
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Exception occurred while fetching Indeed jobs',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Update Remotive fetcher to support pagination
    private function getRemotiveJobs($keyword, $location, $page = 1, $perPage = 10)
    {
        $url = 'https://remotive.com/api/remote-jobs';
        $params = [
            'limit' => $perPage,
            'offset' => ($page - 1) * $perPage,
        ];
        if ($keyword) $params['search'] = $keyword;
        if ($location) $params['location'] = $location;
        $response = Http::get($url, $params);
        $jobs = [];
        $total = 0;
        if ($response->successful()) {
            $json = $response->json();
            $total = $json['meta']['total'] ?? 0;
            foreach ($json['jobs'] ?? [] as $job) {
                $jobs[] = [
                    'title' => $job['title'] ?? '',
                    'company' => $job['company_name'] ?? '',
                    'location' => $job['candidate_required_location'] ?? '',
                    'salary' => $job['salary'] ?? '',
                    'type' => $job['job_type'] ?? '',
                    'work_type' => 'remote',
                    'url' => $job['url'] ?? '',
                    'source' => 'remotive',
                    'description' => $job['description'] ?? '',
                    'date' => $job['publication_date'] ?? '',
                    'site' => 'Remotive',
                ];
            }
        }
        return ['jobs' => $jobs, 'total' => $total];
    }

    // Update The Muse fetcher to support pagination
    private function getTheMuseJobs($keyword, $location, $page = 1, $perPage = 10)
    {
        $url = 'https://www.themuse.com/api/public/jobs';
        $params = ['page' => $page, 'descending' => true];
        if ($keyword) $params['query'] = $keyword;
        if ($location) $params['location'] = $location;
        $response = Http::get($url, $params);
        $jobs = [];
        $total = 0;
        if ($response->successful()) {
            $json = $response->json();
            $total = $json['page_count'] ? $json['page_count'] * $perPage : 0;
            foreach ($json['results'] ?? [] as $job) {
                $jobs[] = [
                    'title' => $job['name'] ?? '',
                    'company' => $job['company']['name'] ?? '',
                    'location' => implode(', ', $job['locations'] ? array_column($job['locations'], 'name') : []),
                    'salary' => '',
                    'type' => $job['type'] ?? '',
                    'work_type' => '',
                    'url' => $job['refs']['landing_page'] ?? '',
                    'source' => 'themuse',
                    'description' => $job['contents'] ?? '',
                    'date' => $job['publication_date'] ?? '',
                    'site' => 'The Muse',
                ];
            }
        }
        return ['jobs' => $jobs, 'total' => $total];
    }

    // Add Arbeitnow jobs fetcher
    private function getArbeitnowJobs($keyword, $location)
    {
        $url = 'https://www.arbeitnow.com/api/job-board-api';
        $response = Http::get($url);
        $jobs = [];
        if ($response->successful()) {
            foreach ($response->json('data') ?? [] as $job) {
                // Filter by keyword/location if provided
                if ($keyword && stripos($job['title'], $keyword) === false) continue;
                if ($location && stripos($job['location'], $location) === false) continue;
                $jobs[] = [
                    'title' => $job['title'] ?? '',
                    'company' => $job['company'] ?? '',
                    'location' => $job['location'] ?? '',
                    'salary' => $job['salary'] ?? '',
                    'type' => $job['employment_type'] ?? '',
                    'work_type' => $job['remote'] ? 'remote' : '',
                    'url' => $job['url'] ?? '',
                    'source' => 'arbeitnow',
                    'description' => $job['description'] ?? '',
                    'date' => $job['created_at'] ?? '',
                    'site' => 'Arbeitnow',
                ];
            }
        }
        return $jobs;
    }

    // Fetch jobs from Remote OK
    private function getRemoteOKJobs($keyword, $location)
    {
        $url = 'https://remoteok.com/api';
        $response = Http::get($url);
        $jobs = [];
        if ($response->successful()) {
            foreach ($response->json() as $job) {
                if (!isset($job['position'])) continue; // skip metadata
                if ($keyword && stripos($job['position'], $keyword) === false) continue;
                if ($location && isset($job['location']) && stripos($job['location'], $location) === false) continue;
                $jobs[] = [
                    'title' => $job['position'] ?? '',
                    'company' => $job['company'] ?? '',
                    'location' => $job['location'] ?? '',
                    'salary' => $job['salary'] ?? '',
                    'type' => $job['tags'][0] ?? '',
                    'work_type' => 'remote',
                    'url' => $job['url'] ?? '',
                    'source' => 'remoteok',
                    'description' => $job['description'] ?? '',
                    'date' => $job['date'] ?? '',
                    'site' => 'Remote OK',
                ];
            }
        }
        return $jobs;
    }

    // Fetch jobs from Open Skills
    private function getOpenSkillsJobs($keyword)
    {
        // IMPORTANT: For better results, add your own Open Skills API credentials to your .env file
        $apiKey = env('OPEN_SKILLS_API_KEY', '');
        $url = "https://api.openskills.io/v1/jobs/search?query=$keyword";
        $response = Http::withHeaders([
            'Authorization' => "Bearer $apiKey",
        ])->get($url);
        $jobs = [];
        if ($response->successful()) {
            foreach ($response->json('results') ?? [] as $job) {
                $jobs[] = [
                    'title' => $job['title'] ?? '',
                    'company' => $job['company'] ?? '',
                    'location' => $job['location'] ?? '',
                    'salary' => $job['salary'] ?? '',
                    'type' => $job['type'] ?? '',
                    'work_type' => '',
                    'url' => $job['url'] ?? '',
                    'source' => 'openskills',
                    'description' => $job['description'] ?? '',
                    'date' => $job['created_at'] ?? '',
                    'site' => 'Open Skills',
                ];
            }
        }
        return $jobs;
    }

    // Fetch jobs from Adzuna (public demo, limited results)
    private function getAdzunaJobs($keyword, $location)
    {
        // IMPORTANT: For better results, add your own ADZUNA_APP_ID and ADZUNA_APP_KEY to your .env file
        $app_id = env('ADZUNA_APP_ID', 'demo');
        $app_key = env('ADZUNA_APP_KEY', 'demo');
        $country = 'us';
        $url = "https://api.adzuna.com/v1/api/jobs/$country/search/1";
        $params = [
            'app_id' => $app_id,
            'app_key' => $app_key,
            'results_per_page' => 20,
            'what' => $keyword,
            'where' => $location,
        ];
        $response = Http::get($url, $params);
        $jobs = [];
        if ($response->successful()) {
            foreach ($response->json('results') ?? [] as $job) {
                $jobs[] = [
                    'title' => $job['title'] ?? '',
                    'company' => $job['company']['display_name'] ?? '',
                    'location' => $job['location']['display_name'] ?? '',
                    'salary' => $job['salary_is_predicted'] == '1' ? '' : ($job['salary_min'] ?? ''),
                    'type' => $job['contract_type'] ?? '',
                    'work_type' => '',
                    'url' => $job['redirect_url'] ?? '',
                    'source' => 'adzuna',
                    'description' => $job['description'] ?? '',
                    'date' => $job['created'] ?? '',
                    'site' => 'Adzuna',
                ];
            }
        }
        return $jobs;
    }

    // Fetch jobs from Jobicy API
    private function getJobicyJobs($keyword, $location)
    {
        $url = 'https://jobicy.com/api/v2/remote-jobs';
        $response = Http::get($url);
        $jobs = [];
        if ($response->successful()) {
            foreach ($response->json()['jobs'] ?? [] as $job) {
                // Filter by keyword/location if provided
                if ($keyword && stripos($job['jobTitle'] ?? '', $keyword) === false) continue;
                if ($location && stripos($job['jobGeo'] ?? '', $location) === false) continue;
                $jobs[] = [
                    'title' => $job['jobTitle'] ?? '',
                    'company' => $job['companyName'] ?? '',
                    'location' => $job['jobGeo'] ?? '',
                    'salary' => $job['salary'] ?? '',
                    'type' => isset($job['jobType']) && is_array($job['jobType']) ? implode(', ', $job['jobType']) : ($job['jobType'] ?? ''),
                    'work_type' => 'remote',
                    'url' => $job['url'] ?? '',
                    'source' => 'jobicy',
                    'description' => $job['jobDescription'] ?? $job['jobExcerpt'] ?? '',
                    'date' => $job['date'] ?? '',
                    'site' => 'Jobicy',
                ];
            }
        }
        return $jobs;
    }
} 