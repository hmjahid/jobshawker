<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\JobListing;

class JobListingsController extends Controller
{
    public function index(Request $request)
    {
        $query = JobListing::query();

        if ($request->has('keyword')) {
            $keyword = $request->input('keyword');
            $query->where(function ($q) use ($keyword) {
                $q->where('title', 'like', '%' . $keyword . '%')
                  ->orWhere('description', 'like', '%' . $keyword . '%')
                  ->orWhere('company', 'like', '%' . $keyword . '%');
            });
        }

        if ($request->has('min_salary')) {
            $query->where('min_salary', '>=', $request->input('min_salary'));
        }

        if ($request->has('max_salary')) {
            $query->where('max_salary', '<=', $request->input('max_salary'));
        }

        if ($request->has('source')) {
            $query->whereIn('source', explode(',', $request->input('source')));
        }

        $perPage = $request->input('per_page', 10);
        return $query->paginate($perPage);
    }
}
