import React from 'react';
import { Calendar, MoreHorizontal, Verified, Trash } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import axios from 'axios';
import ImageCarousel from './ImageCarousel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

const PromotionalCampaign = ({ campaign }) => {
  const canDelete = campaign?.createdBy && (window?.LOCAL_USER?.role === 'admin');

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white shadow-lg rounded-2xl overflow-hidden border-0">
      {/* Header with uploader info */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 ring-2 ring-blue-100">
              <AvatarImage 
                src={campaign.createdBy?.avatar} 
                alt={campaign.createdBy?.firstName || campaign.createdBy?.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-500 text-white font-semibold">
                {(campaign.createdBy?.firstName || campaign.createdBy?.name || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900 text-base">
                  {campaign.createdBy?.firstName ? `${campaign.createdBy.firstName}${campaign.createdBy.lastName ? ' ' + campaign.createdBy.lastName : ''}` : (campaign.createdBy?.name || 'User')}
                </h3>
                {campaign.createdBy?.isVerified && (
                  <Verified className="h-4 w-4 text-blue-500" />
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(campaign.createdAt)}</span>
                <span>•</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">Promotional</Badge>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded hover:bg-gray-100">
                <MoreHorizontal className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              {canDelete && (
                <DropdownMenuItem onClick={async () => {
                  if (!window.confirm('Delete this campaign? This cannot be undone.')) return;
                  try {
                    await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/campaigns/${campaign._id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
                    window.location.href = '/campaigns';
                  } catch (e) {}
                }} className="text-red-600">
                  <Trash className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Campaign Title and Description */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 leading-tight">{campaign.title}</h2>
          {campaign.description && (
            <p className="text-gray-700 leading-relaxed">{campaign.description}</p>
          )}
        </div>
      </CardHeader>

      {/* Campaign Media */}
      {(campaign.media?.length || campaign.image) && (
        <div className="relative">
          <ImageCarousel
            images={(campaign.media && campaign.media.length ? campaign.media : [campaign.image]).slice(0, 10)}
            className="w-full h-80"
            imgClassName="h-80"
          />
        </div>
      )}

      <CardContent className="pt-6">
        {/* Featured sections removed per request */}

        {/* Campaign Duration */}
        {(campaign.startDate || campaign.endDate) && (
          <div className="mt-8 p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Campaign Duration</h4>
            <div className="text-sm text-green-700">
              {campaign.startDate && (
                <p>Starts: {formatDate(campaign.startDate)}</p>
              )}
              {campaign.endDate && (
                <p>Ends: {formatDate(campaign.endDate)}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PromotionalCampaign;
