import React, { useEffect, useState, useMemo, useRef } from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import {
  Container, TextField, Box, Typography, Grid, MenuItem, Select, InputLabel, FormControl, OutlinedInput, Checkbox, ListItemText, Paper, AppBar, Toolbar, LinearProgress, CircularProgress, Tabs, Tab
} from '@mui/material';
import { Search, Work, Facebook, Twitter, LinkedIn, GitHub, Sort } from '@mui/icons-material';
import JobCard from './JobCard';

const SOURCES = [
  'all',
  'careerjet',
  'jsearch',
  'remotive',
  'themuse',
  'arbeitnow',
  'remoteok',
  'jobicy',
  'indeed',
  'linkedin',
  'google',
  'turing',
  // 'usajobs', // Removed to only show scraped sources
];

const TYPES = [
  { label: 'All Types', value: '' },
  { label: 'Remote', value: 'remote' },
  { label: 'Onsite', value: 'onsite' },
  { label: 'Hybrid', value: 'hybrid' },
];

const JobLogo = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="12" fill="#FFD600"/>
    <rect x="10" y="18" width="28" height="16" rx="4" fill="#232526"/>
    <rect x="18" y="12" width="12" height="8" rx="2" fill="#232526"/>
    <rect x="20" y="14" width="8" height="4" rx="1" fill="#FFD600"/>
    <rect x="14" y="24" width="20" height="2" rx="1" fill="#FFD600"/>
    <rect x="14" y="28" width="8" height="2" rx="1" fill="#FFD600"/>
    <rect x="26" y="28" width="8" height="2" rx="1" fill="#FFD600"/>
  </svg>
);

function JobSearch() {
  const [jobs, setJobs] = useState([]);
  const [visibleJobs, setVisibleJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState('');
  const [sources, setSources] = useState(['all']);
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [showFeatured, setShowFeatured] = useState(true);
  const jobsPerPage = 10;
  const [page, setPage] = useState(1);
  const containerRef = useRef(null);
  const [sortBy, setSortBy] = useState('featured');
  const [hasMore, setHasMore] = useState(true);
  const [preloadedFeaturedJobs, setPreloadedFeaturedJobs] = useState([]);
  const [featuredPage, setFeaturedPage] = useState(1);
  const featuredJobsPerPage = 10;
  const paginatedFeaturedJobs = preloadedFeaturedJobs.slice(0, featuredPage * featuredJobsPerPage);
  const canLoadMoreFeatured = preloadedFeaturedJobs.length > paginatedFeaturedJobs.length;
  const [totalJobs, setTotalJobs] = useState(0);

  // Track if more jobs are available for current mode
  const canLoadMore = hasMore && jobs.length > 0 && !loading;

  // Debounced fetch
  const fetchJobs = async (params, reset = true) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/scraped-jobs', { params: { ...params, page: reset ? 1 : page + 1, per_page: jobsPerPage } });
      const fetchedJobs = res.data.jobs || [];
      if (reset) {
        setJobs(fetchedJobs);
        setPage(1);
      } else {
        setJobs(prev => [...prev, ...fetchedJobs]);
        setPage(prev => prev + 1);
      }
      setHasMore(fetchedJobs.length === jobsPerPage);
      setShowFeatured(params.sort === 'featured');
      setTotalJobs(res.data.total || 0);
    } catch (err) {
      setError('Failed to fetch jobs. Please try again.');
      setJobs([]);
      setShowFeatured(false);
      setHasMore(false);
      setTotalJobs(0);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  const debouncedFetch = useMemo(() => debounce(fetchJobs, 500), []);

  // On mount, fetch jobs for featured mode (sortBy === 'featured') and preload featured jobs
  useEffect(() => {
    setSortBy('featured');
    setKeyword('');
    setType('');
    setSources(['all']);
    setMinSalary('');
    setMaxSalary('');
    const params = {
      keyword: '',
      type: '',
      source: 'all',
      min_salary: '',
      max_salary: '',
      sort: 'latest',
      page: 1,
      per_page: jobsPerPage,
    };
    axios.get('/api/scraped-jobs', { params })
      .then(res => setPreloadedFeaturedJobs((res.data.jobs || []).slice(0, 20)))
      .catch(() => setPreloadedFeaturedJobs([]));
    fetchJobs(params, true);
    // eslint-disable-next-line
  }, []);

  // Fetch jobs when filters or sort change (except initial featured load)
  useEffect(() => {
    if (sortBy !== 'featured') {
      const params = {
        keyword,
        type,
        source: sources.join(','),
        min_salary: minSalary,
        max_salary: maxSalary,
        sort: sortBy,
        page: 1,
        per_page: jobsPerPage,
      };
      fetchJobs(params, true);
    }
    // eslint-disable-next-line
  }, [keyword, type, sources, minSalary, maxSalary, sortBy]);

  // Reset visibleJobs when jobs change
  useEffect(() => {
    setVisibleJobs(jobs.slice(0, jobsPerPage));
    setPage(1);
  }, [jobs]);

  // Reset featuredPage when preloadedFeaturedJobs changes or sortBy changes
  useEffect(() => {
    setFeaturedPage(1);
  }, [preloadedFeaturedJobs, sortBy]);

  // When filters change, reset page to 1 and set sortBy to 'latest' if any filter is active
  useEffect(() => {
    if (keyword || type || (sources.length && !sources.includes('all')) || minSalary || maxSalary) {
      setSortBy('latest');
    }
    setPage(1);
  }, [keyword, type, sources, minSalary, maxSalary]);

  const getSourceColor = (source) => {
    const colors = {
      careerjet: '#2E7D32',
      indeed: '#1976D2',
      linkedin: '#0A66C2',
      google: '#DB4437',
      turing: '#FF6B35'
    };
    return colors[source] || '#666';
  };

  const getTypeColor = (type) => {
    const colors = {
      remote: '#4CAF50',
      onsite: '#FF9800',
      hybrid: '#9C27B0'
    };
    return colors[type] || '#666';
  };

  const handleSourcesChange = (event) => {
    const value = event.target.value;
    if (value.includes('all')) {
      setSources(['all']);
      setPage(1);
    } else if (value.includes('featured')) {
      setSources(['featured']);
      setShowFeatured(true);
      setJobs([]);
      setVisibleJobs([]);
      setPage(1);
    } else {
      setSources(value);
      setPage(1);
    }
  };

  // Load more handler
  const handleLoadMore = () => {
    const params = {
      keyword,
      type,
      source: sources.join(','),
      min_salary: minSalary,
      max_salary: maxSalary,
      sort: sortBy,
      page: page + 1,
      per_page: jobsPerPage,
    };
    fetchJobs(params, false);
  };

  // Sort handler
  const handleSortChange = (event) => {
    setSortBy(event.target.value);
    setPage(1);
    if (event.target.value === 'featured') {
      setShowFeatured(true);
      setJobs([]);
      setVisibleJobs([]);
      setKeyword('');
      setType('');
      setMinSalary('');
      setMaxSalary('');
    } else {
      setShowFeatured(false);
      // Fetch all jobs with current filters and sort
      const params = {
        keyword,
        type,
        source: sources.join(','),
        min_salary: minSalary,
        max_salary: maxSalary,
        sort: event.target.value,
      };
      fetchJobs(params);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #232526 0%, #FFD600 100%)', overflowY: 'scroll', height: '100vh', scrollbarWidth: 'thin', '&::-webkit-scrollbar': { width: '8px', background: '#eee' }, '&::-webkit-scrollbar-thumb': { background: '#FFD600', borderRadius: '4px' } }}>
      {/* Header */}
      <AppBar position="static" sx={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
        <Toolbar>
          <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
            <JobLogo />
          </Box>
          <Typography variant="h4" component="div" sx={{ flexGrow: 1, color: '#FFD600', fontWeight: 'bold', letterSpacing: 2, textShadow: '2px 2px 8px #000' }}>
            JobsHawker
          </Typography>
          <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500, letterSpacing: 1, textShadow: '1px 1px 4px #000' }}>
            Find Your Dream Job
          </Typography>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 2, px: { xs: 1, md: 2 }, width: '100%', maxWidth: '100%' }}>
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: 6, color: 'white', background: 'rgba(0,0,0,0.25)', borderRadius: 4, py: 5, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
          <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2, textShadow: '4px 4px 16px #000, 0 2px 8px #FFD600' }}>
            Welcome to <span style={{ color: '#FFD600', textShadow: '2px 2px 8px #000' }}>JobsHawker</span>
          </Typography>
          <Typography variant="h5" sx={{ opacity: 0.95, mb: 4, color: '#FFD600', textShadow: '1px 1px 6px #000' }}>
            Search thousands of jobs from top companies worldwide
          </Typography>
        </Box>

        {/* Search Filters */}
        <Paper elevation={12} sx={{ p: 4, mb: 4, borderRadius: 4, background: 'rgba(255,255,255,0.98)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', backdropFilter: 'blur(10px)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#FFD600', letterSpacing: 1, textShadow: '1px 1px 4px #000' }}>
              <Search sx={{ mr: 1, verticalAlign: 'middle', color: '#FFD600' }} />
              Search Jobs
            </Typography>
            <button
              onClick={() => {
                setKeyword('');
                setType('');
                setSources(['all']);
                setMinSalary('');
                setMaxSalary('');
                setSortBy('featured');
              }}
              style={{
                background: '#FFD600',
                color: '#232526',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '20px',
                padding: '8px 24px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                fontSize: '1rem',
                transition: 'background 0.2s, color 0.2s, transform 0.15s',
              }}
            >
              Reset Filters
            </button>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={2}>
              <TextField
                label="Job Title or Keywords"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                fullWidth
                variant="outlined"
                placeholder="e.g., Software Engineer, Python Developer"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            
            <Grid item xs={12} md={10}>
              <FormControl sx={{ width: { xs: '100%', md: 160 } }}>
                <InputLabel>Job Type</InputLabel>
                <Select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  label="Job Type"
                  sx={{ borderRadius: 2 }}
                >
                  {TYPES.map(t => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ width: { md: '110px', xs: '100%' } }}>
                <InputLabel>Job Sources</InputLabel>
                <Select
                  multiple
                  value={sources}
                  onChange={handleSourcesChange}
                  input={<OutlinedInput label="Job Sources" />}
                  renderValue={selected =>
                    selected.includes('all') ? 'All' : selected.map(source =>
                      source === 'careerjet' ? 'Careerjet' :
                      source === 'jsearch' ? 'JSearch' :
                      source === 'remotive' ? 'Remotive' :
                      source === 'themuse' ? 'The Muse' :
                      source === 'arbeitnow' ? 'Arbeitnow' :
                      source === 'remoteok' ? 'Remote OK' :
                      source === 'jobicy' ? 'Jobicy' :
                      source === 'indeed' ? 'Indeed' :
                      source === 'linkedin' ? 'LinkedIn' :
                      source === 'google' ? 'Google' :
                      source === 'turing' ? 'Turing' :
                      source === 'usjobs' ? 'US Jobs' :
                      source
                    ).join(', ')
                  }
                  sx={{ borderRadius: 2 }}
                >
                  {SOURCES.map(source => (
                    <MenuItem key={source} value={source}>
                      <Checkbox checked={sources.includes(source)} />
                      <ListItemText primary={
                        source === 'all' ? 'All' :
                        source === 'careerjet' ? 'Careerjet' :
                        source === 'jsearch' ? 'JSearch' :
                        source === 'remotive' ? 'Remotive' :
                        source === 'themuse' ? 'The Muse' :
                        source === 'arbeitnow' ? 'Arbeitnow' :
                        source === 'remoteok' ? 'Remote OK' :
                        source === 'jobicy' ? 'Jobicy' :
                        source === 'indeed' ? 'Indeed' :
                        source === 'linkedin' ? 'LinkedIn' :
                        source === 'google' ? 'Google' :
                        source === 'turing' ? 'Turing' :
                        source === 'usjobs' ? 'US Jobs' :
                        source
                      } />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                label="Min Salary"
                type="number"
                value={minSalary}
                onChange={e => setMinSalary(e.target.value)}
                fullWidth
                variant="outlined"
                placeholder="50000"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                label="Max Salary"
                type="number"
                value={maxSalary}
                onChange={e => setMaxSalary(e.target.value)}
                fullWidth
                variant="outlined"
                placeholder="150000"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Loading and Error States */}
        {/* Removed top loading GIF as requested */}
        
        {error && (
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#ffebee', border: '1px solid #f44336' }}>
            <Typography color="error" align="center">{error}</Typography>
          </Paper>
        )}

        {/* Sort By Dropdown */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="sort-by-label" sx={{ fontWeight: 'bold', color: '#FFD600' }}>Sort By</InputLabel>
            <Select
              labelId="sort-by-label"
              value={sortBy}
              label="Sort By"
              onChange={handleSortChange}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="featured">Featured</MenuItem>
              <MenuItem value="latest">Latest</MenuItem>
              <MenuItem value="oldest">Oldest</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Job Cards (Featured + Results) */}
        <Grid container spacing={2} sx={{ m: 0, width: '100%' }} ref={containerRef}>
          {/* Featured Jobs Section */}
          {sortBy === 'featured' && (
            <Grid item xs={12} sx={{ width: '100%' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#FFD600', mb: 2, textShadow: '1px 1px 4px #000' }}>
                {(keyword || type || (sources.length && !sources.includes('all')) || minSalary || maxSalary) ? 'Search Results' : 'Featured Jobs'}
              </Typography>
              {preloadedFeaturedJobs.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                  <CircularProgress size={48} sx={{ color: '#FFD600' }} />
                </Box>
              ) : (
                paginatedFeaturedJobs.map((job, idx) => (
                  <Box key={idx} sx={{ mb: 3 }}>
                    <JobCard job={job} getSourceColor={getSourceColor} getTypeColor={getTypeColor} featured />
                  </Box>
                ))
              )}
              {/* Load More for Featured Jobs */}
              {canLoadMoreFeatured && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <button
                    onClick={() => setFeaturedPage(fp => fp + 1)}
                    style={{
                      background: '#232526',
                      color: '#FFD600',
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                      border: 'none',
                      borderRadius: '24px',
                      padding: '14px 40px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      transition: 'background 0.2s, color 0.2s, transform 0.15s',
                      letterSpacing: '1px',
                      textShadow: 'none',
                      outline: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      minWidth: '160px',
                    }}
                  >
                    Load More
                  </button>
                </Box>
              )}
            </Grid>
          )}
          {/* All Jobs Section */}
          {sortBy !== 'featured' && (
            <Grid item xs={12} sx={{ width: '100%' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#232526', mb: 2, textShadow: '1px 1px 4px #FFD600' }}>
                {(keyword || type || (sources.length && !sources.includes('all')) || minSalary || maxSalary) ? 'Search Results' : 'All Jobs'}
              </Typography>
              {/* No jobs found - only show if not loading, not error, and no jobs in jobs */}
              {!loading && !error && jobs.length === 0 && (
                <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.9)' }}>
                  <Work sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary">
                    No jobs found matching your criteria
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Try adjusting your search filters or keywords
                  </Typography>
                </Paper>
              )}
              {/* Render only loaded jobs (paginated) */}
              {jobs.map((job, idx) => (
                <Box key={idx} sx={{ mb: 3 }}>
                  <JobCard 
                    job={job} 
                    getSourceColor={getSourceColor} 
                    getTypeColor={getTypeColor} 
                  />
                </Box>
              ))}
            </Grid>
          )}
        </Grid>
        {/* Load More Button (for all job types) */}
        {canLoadMore && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
            <button
              onClick={handleLoadMore}
              onMouseOver={e => {
                e.currentTarget.style.background = '#FFD600';
                e.currentTarget.style.color = '#232526';
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,214,0,0.18)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = '#232526';
                e.currentTarget.style.color = '#FFD600';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
              }}
              onMouseDown={e => {
                e.currentTarget.style.transform = 'scale(0.97)';
              }}
              onMouseUp={e => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              style={{
                background: '#232526',
                color: '#FFD600',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                border: 'none',
                borderRadius: '24px',
                padding: '14px 40px',
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                transition: 'background 0.2s, color 0.2s, transform 0.15s, box-shadow 0.2s',
                letterSpacing: '1px',
                textShadow: 'none',
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                minWidth: '160px',
                position: 'relative',
                overflow: 'hidden',
              }}
              disabled={loading}
            >
              Load More
              {/* Ripple effect */}
              <span className="ripple" style={{
                position: 'absolute',
                borderRadius: '50%',
                transform: 'scale(0)',
                animation: 'ripple 0.6s linear',
                backgroundColor: 'rgba(255,214,0,0.3)',
                pointerEvents: 'none',
                left: '50%',
                top: '50%',
                width: 120,
                height: 120,
                opacity: 0,
              }}></span>
            </button>
          </Box>
        )}
      </Container>
      {/* Footer */}
      <Box component="footer" sx={{
        width: '100%',
        mt: 6,
        py: 4,
        background: 'linear-gradient(90deg, #232526 0%, #FFD600 100%)',
        color: '#232526',
        textAlign: 'center',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        position: 'relative',
        zIndex: 10
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2, gap: 2 }}>
          <JobLogo />
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#232526', letterSpacing: 2 }}>
            JobsHawker
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 1 }}>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
            <Facebook sx={{ color: '#FFD600', fontSize: 28, transition: 'color 0.2s', '&:hover': { color: '#1877f3' } }} />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            <Twitter sx={{ color: '#FFD600', fontSize: 28, transition: 'color 0.2s', '&:hover': { color: '#1da1f2' } }} />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
            <LinkedIn sx={{ color: '#FFD600', fontSize: 28, transition: 'color 0.2s', '&:hover': { color: '#0a66c2' } }} />
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            <GitHub sx={{ color: '#FFD600', fontSize: 28, transition: 'color 0.2s', '&:hover': { color: '#333' } }} />
          </a>
        </Box>
        <Typography variant="body2" sx={{ color: '#232526', opacity: 0.8 }}>
          © {new Date().getFullYear()} JobsHawker. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}

export default JobSearch;

/* Add ripple effect keyframes globally */
if (typeof window !== 'undefined' && !document.getElementById('ripple-style')) {
  const style = document.createElement('style');
  style.id = 'ripple-style';
  style.innerHTML = `@keyframes ripple { to { transform: scale(2.5); opacity: 0; } }`;
  document.head.appendChild(style);
} 