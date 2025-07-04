<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobListing extends Model
{
    protected $table = 'job_listings';

    protected $fillable = [
        'title',
        'description',
        'location',
        'type',
        'min_salary',
        'max_salary',
        'company',
        'url',
        'source',
    ];
}
