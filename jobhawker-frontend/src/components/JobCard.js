import React from 'react';
import {
  Card, CardContent, CardActions, Button, Chip, Box, Typography, Avatar, Divider
} from '@mui/material';
import { LocationOn, Business, AttachMoney, TrendingUp } from '@mui/icons-material';

function JobCard({ job, getSourceColor, getTypeColor, featured }) {
  const workArrangement =
    job.work_type ||
    job.arrangement ||
    job.location_type ||
    (job.location && job.location.toLowerCase().includes('remote') ? 'remote' : '') ||
    '';
  let contractType = job.type || '';
  if (Array.isArray(contractType)) {
    contractType = contractType.join(', ');
  } else if (typeof contractType !== 'string') {
    contractType = String(contractType || '');
  }
  const [showFullDesc, setShowFullDesc] = React.useState(false);
  const descLimit = 300;
  const desc = job.description || '';
  const isLongDesc = desc.length > descLimit;
  const descPreview = isLongDesc && !showFullDesc ? desc.substring(0, descLimit) + '...' : desc;
  return (
    <Card 
      elevation={4} 
      sx={{ 
        width: '100%',
        maxWidth: '100%',
        borderRadius: 3, 
        transition: 'all 0.3s ease',
        position: 'relative',
        '&:hover': { 
          transform: 'translateY(-4px)', 
          boxShadow: '0 12px 24px rgba(0,0,0,0.15)' 
        }
      }}
    >
      {/* Featured Badge */}
      {featured && (
        <Box sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          bgcolor: '#FFD600',
          color: '#232526',
          px: 2,
          py: 0.5,
          borderRadius: 2,
          fontWeight: 'bold',
          fontSize: 14,
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          zIndex: 2
        }}>
          Featured
        </Box>
      )}
      <CardContent sx={{ p: 4 }}>
        <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
          <Avatar sx={{ bgcolor: getSourceColor(job.source), width: 56, height: 56 }}>
            <Business />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
              {job.title}
            </Typography>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Typography variant="subtitle1" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                <Business sx={{ mr: 0.5, fontSize: 16 }} />
                {job.company}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationOn sx={{ mr: 0.5, fontSize: 16 }} />
                {job.location}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Box display="flex" gap={1} mb={2} flexWrap="wrap" alignItems="center">
          <Chip 
            label={workArrangement ? workArrangement.charAt(0).toUpperCase() + workArrangement.slice(1) : 'N/A'} 
            size="small" 
            sx={{ 
              bgcolor: getTypeColor(workArrangement), 
              color: 'white',
              fontWeight: 'bold',
              minWidth: 100,
              px: 2,
              fontSize: 16
            }} 
          />
          <Chip 
            label={contractType ? contractType.charAt(0).toUpperCase() + contractType.slice(1) : 'N/A'} 
            size="small" 
            sx={{ 
              bgcolor: '#607d8b',
              color: 'white',
              fontWeight: 'bold',
              minWidth: 100,
              px: 2,
              fontSize: 16
            }} 
          />
          <Chip 
            label={job.source} 
            size="small" 
            sx={{ 
              bgcolor: getSourceColor(job.source), 
              color: 'white',
              fontWeight: 'bold'
            }} 
          />
        </Box>
        
        {job.salary && (
          <Box display="flex" alignItems="center" mb={2}>
            <AttachMoney sx={{ mr: 0.5, color: '#4CAF50' }} />
            <Typography variant="body1" color="success.main" sx={{ fontWeight: 'bold' }}>
              {job.salary}
            </Typography>
          </Box>
        )}
        
        {job.description && (
          typeof job.description === 'string' && /<[^>]+>/.test(job.description) ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" component="div" sx={{ mb: 2 }}
                dangerouslySetInnerHTML={{ __html: descPreview }}
              />
              {isLongDesc && (
                <Button size="small" sx={{ mt: -1, mb: 1, color: '#FFD600', fontWeight: 'bold' }} onClick={() => setShowFullDesc(v => !v)}>
                  {showFullDesc ? 'Show less' : 'Show more'}
                </Button>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {descPreview}
              {isLongDesc && (
                <Button size="small" sx={{ mt: -1, mb: 1, color: '#FFD600', fontWeight: 'bold' }} onClick={() => setShowFullDesc(v => !v)}>
                  {showFullDesc ? 'Show less' : 'Show more'}
                </Button>
              )}
            </Typography>
          )
        )}
      </CardContent>
      
      <Divider />
      
      <CardActions sx={{ p: 3, justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <TrendingUp sx={{ color: '#4CAF50', fontSize: 20 }} />
          <Typography variant="body2" color="text.secondary">
            Posted recently
          </Typography>
        </Box>
        <Button 
          href={job.url} 
          target="_blank" 
          rel="noopener" 
          variant="contained" 
          size="large"
          sx={{ 
            borderRadius: 2, 
            px: 4, 
            py: 1.5,
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
            }
          }}
        >
          Apply Now
        </Button>
      </CardActions>
    </Card>
  );
}

export default JobCard; 