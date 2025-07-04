<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\JobListingsController;
use App\Http\Controllers\ScrapedJobsController;
use App\Http\Middleware\Cors;

Route::get('/', function () {
    return view('welcome');
});

Route::middleware([Cors::class])->group(function () {
    Route::get('/api/jobs', [JobListingsController::class, 'index']);
    Route::get('/api/scraped-jobs', [ScrapedJobsController::class, 'index']);
    Route::get('/api/glassdoor/interview-details', [ScrapedJobsController::class, 'getGlassdoorInterviewDetails']);
    Route::post('/api/indeed/jobs', [ScrapedJobsController::class, 'getIndeedJobs']);
});
