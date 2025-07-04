<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class CareerjetAPI
{
    private $api;
    private $affiliateId;

    public function __construct()
    {
        $this->affiliateId = env('CAREERJET_AFFILIATE_ID', '');
        $this->api = new \Careerjet_API('en_US'); // Default to US locale
    }

    public function searchJobs($params = [])
    {
        try {
            $searchParams = [
                'affid' => $this->affiliateId,
                'keywords' => $params['keyword'] ?? '',
                'location' => $params['location'] ?? '',
                'pagesize' => $params['pagesize'] ?? 20,
                'page' => $params['page'] ?? 1,
            ];

            // Add contract type if specified
            if (!empty($params['type'])) {
                $searchParams['contracttype'] = $this->mapJobTypeToContractType($params['type']);
            }

            // Add salary filters if specified
            if (!empty($params['min_salary'])) {
                $searchParams['salary_min'] = $params['min_salary'];
            }
            if (!empty($params['max_salary'])) {
                $searchParams['salary_max'] = $params['max_salary'];
            }

            $result = $this->api->search($searchParams);

            if ($result->type === 'JOBS') {
                return [
                    'success' => true,
                    'jobs' => $this->normalizeJobs($result->jobs),
                    'total_hits' => $result->hits ?? 0,
                    'pages' => $result->pages ?? 1
                ];
            } elseif ($result->type === 'LOCATIONS') {
                return [
                    'success' => false,
                    'error' => 'Location ambiguous',
                    'suggestions' => $result->locations ?? []
                ];
            } else {
                return [
                    'success' => false,
                    'error' => $result->error ?? 'Unknown error occurred'
                ];
            }
        } catch (\Exception $e) {
            Log::error('Careerjet API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Failed to fetch jobs from Careerjet'
            ];
        }
    }

    private function normalizeJobs($jobs)
    {
        $normalizedJobs = [];
        
        foreach ($jobs as $job) {
            $normalizedJobs[] = [
                'title' => $job->title ?? '',
                'company' => $job->company ?? '',
                'location' => $job->locations ?? '',
                'salary' => $job->salary ?? '',
                'type' => $this->mapContractTypeToJobType($job->contracttype ?? ''),
                'url' => $job->url ?? '',
                'source' => 'careerjet',
                'description' => $job->description ?? '',
                'date' => $job->date ?? '',
                'site' => $job->site ?? ''
            ];
        }

        return $normalizedJobs;
    }

    private function mapJobTypeToContractType($jobType)
    {
        $mapping = [
            'remote' => 'p', // permanent
            'onsite' => 'p', // permanent
            'hybrid' => 'p', // permanent
            'contract' => 'c',
            'temporary' => 't',
            'part-time' => 'p',
            'full-time' => 'f'
        ];

        return $mapping[strtolower($jobType)] ?? 'p';
    }

    private function mapContractTypeToJobType($contractType)
    {
        $mapping = [
            'p' => 'permanent',
            'c' => 'contract',
            't' => 'temporary',
            'i' => 'training',
            'v' => 'voluntary',
            'f' => 'full-time',
            'part' => 'part-time'
        ];

        return $mapping[$contractType] ?? 'permanent';
    }
} 