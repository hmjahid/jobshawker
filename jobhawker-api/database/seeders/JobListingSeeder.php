<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class JobListingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('job_listings')->insert([
            [
                'title' => 'Software Engineer',
                'description' => 'We are looking for a talented Software Engineer to join our team.',
                'location' => 'San Francisco, CA',
                'type' => 'onsite',
                'min_salary' => 90000,
                'max_salary' => 120000,
                'company' => 'Tech Corp',
                'url' => 'https://example.com/job1',
                'source' => 'Google',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Frontend Developer',
                'description' => 'We are seeking a skilled Frontend Developer to build beautiful and responsive user interfaces.',
                'location' => 'Remote',
                'type' => 'remote',
                'min_salary' => 80000,
                'max_salary' => 110000,
                'company' => 'Creative Solutions',
                'url' => 'https://example.com/job2',
                'source' => 'LinkedIn',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Data Scientist',
                'description' => 'We are hiring a Data Scientist to analyze large datasets and extract valuable insights.',
                'location' => 'New York, NY',
                'type' => 'hybrid',
                'min_salary' => 100000,
                'max_salary' => 130000,
                'company' => 'Data Insights',
                'url' => 'https://example.com/job3',
                'source' => 'Indeed',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Backend Developer',
                'description' => 'Experienced Backend Developer needed for a growing startup.',
                'location' => 'Remote',
                'type' => 'remote',
                'min_salary' => 95000,
                'max_salary' => 125000,
                'company' => 'Innovate Inc.',
                'url' => 'https://example.com/job4',
                'source' => 'SimplyHired',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'DevOps Engineer',
                'description' => 'Join our team as a DevOps Engineer to build and maintain our infrastructure.',
                'location' => 'Austin, TX',
                'type' => 'onsite',
                'min_salary' => 110000,
                'max_salary' => 140000,
                'company' => 'Cloud Solutions',
                'url' => 'https://example.com/job5',
                'source' => 'Turing',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Product Manager',
                'description' => 'Seeking a Product Manager to lead our new product development.',
                'location' => 'San Francisco, CA',
                'type' => 'hybrid',
                'min_salary' => 120000,
                'max_salary' => 150000,
                'company' => 'Product Innovators',
                'url' => 'https://example.com/job6',
                'source' => 'LinkedIn',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
