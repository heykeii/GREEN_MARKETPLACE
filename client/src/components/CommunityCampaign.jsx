import React, { useState } from 'react';
import { Users, MapPin, Calendar, Clock, User, Target, CheckCircle, MoreHorizontal, Verified, Eye, Trash, MessageCircle, Send } from 'lucide-react';
import { Button } from './ui/button';
import ImageCarousel from './ImageCarousel';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { toast } from 'react-hot-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import axios from 'axios';

const CommunityCampaign = ({ campaign, onJoin, onComment, currentUser }) => {
  const [showParticipants, setShowParticipants] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const isSameUser = (a, b) => String(a) === String(b);
  const currentUserId = currentUser?._id || currentUser?.id;
  const canDelete = currentUser && (currentUser.role === 'admin' || (campaign.createdBy && isSameUser(campaign.createdBy?._id || campaign.createdBy?.id, currentUserId)));

  const handleDeleteCampaign = async () => {
    if (!canDelete) return;
    if (!window.confirm('Delete this campaign? This cannot be undone.')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/campaigns/${campaign._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Campaign deleted');
      window.location.href = '/campaigns';
    } catch (e) {
      toast.error('Failed to delete campaign');
    }
  };

  const isParticipant = campaign.participants?.some(participant => participant._id === currentUser?.id);
  const participantsCount = campaign.participants?.length || 0;
  const progressPercentage = campaign.goal > 0 ? Math.min((campaign.progress / campaign.goal) * 100, 100) : 0;

  const handleJoin = async () => {
    if (!currentUser) {
      toast.error('Please login to join campaigns');
      return;
    }
    try {
      await onJoin(campaign._id);
      toast.success(isParticipant ? 'Left campaign successfully' : 'Joined campaign successfully');
    } catch (error) {
      toast.error('Failed to join campaign');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Please login to comment');
      return;
    }
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    
    setIsSubmittingComment(true);
    try {
      await onComment(campaign._id, newComment.trim());
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isEventStarted = campaign.startDate ? new Date(campaign.startDate) <= new Date() : true;
  const isEventEnded = campaign.endDate ? new Date(campaign.endDate) < new Date() : false;

  return (
    <Card className="w-full max-w-3xl mx-auto bg-white shadow-lg rounded-2xl overflow-hidden border-0">
      {/* Header with uploader info */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <a href={`/profile/${campaign.createdBy?._id || campaign.createdBy?.id}`}>
              <Avatar className="h-12 w-12 ring-2 ring-purple-100 cursor-pointer">
                <AvatarImage 
                  src={campaign.createdBy?.avatar} 
                  alt={campaign.createdBy?.firstName || campaign.createdBy?.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-500 text-white font-semibold">
                  {(campaign.createdBy?.firstName || campaign.createdBy?.name || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </a>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <a href={`/profile/${campaign.createdBy?._id || campaign.createdBy?.id}`} className="font-semibold text-gray-900 text-base hover:underline">
                  {campaign.createdBy?.firstName ? `${campaign.createdBy.firstName}${campaign.createdBy.lastName ? ' ' + campaign.createdBy.lastName : ''}` : (campaign.createdBy?.name || 'User')}
                </a>
                {campaign.createdBy?.isVerified && (
                  <Verified className="h-4 w-4 text-blue-500" />
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(campaign.createdAt)}</span>
                <span>•</span>
                <div className="flex flex-col">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    Community
                  </Badge>
                  {isEventEnded && (
                    <Badge className="mt-1 bg-gray-100 text-gray-800 text-[10px]">Event Ended</Badge>
                  )}
                </div>
                <Badge className={getStatusColor(campaign.status) + " text-xs"}>
                  {campaign.status?.charAt(0).toUpperCase() + campaign.status?.slice(1)}
                </Badge>
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
                <DropdownMenuItem onClick={handleDeleteCampaign} className="text-red-600">
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
          <div className="absolute top-4 right-4">
            <Badge className="bg-purple-600 text-white">
              <Target className="h-3 w-3 mr-1" />
              {campaign.progress}/{campaign.goal || '∞'} Joined
            </Badge>
          </div>
        </div>
      )}

      <CardContent className="space-y-6">
        {/* Objectives */}
        {Array.isArray(campaign.objectives) && campaign.objectives.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Objectives</h3>
            <ul className="list-decimal list-inside space-y-1 text-gray-700">
              {campaign.objectives.map((obj, idx) => (
                <li key={idx}>{obj}</li>
              ))}
            </ul>
          </div>
        )}
        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaign.startDate && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Start Date</p>
                <p className="text-sm text-gray-600">
                  {formatDate(campaign.startDate)}
                  {campaign.startDate && (
                    <span className="ml-2">at {formatTime(campaign.startDate)}</span>
                  )}
                </p>
              </div>
            </div>
          )}
          
          {campaign.endDate && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">End Date</p>
                <p className="text-sm text-gray-600">
                  {formatDate(campaign.endDate)}
                  {campaign.endDate && (
                    <span className="ml-2">at {formatTime(campaign.endDate)}</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Progress Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Participation Goal</span>
            </h3>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">{campaign.progress}</p>
              <p className="text-sm text-gray-500">
                {campaign.goal > 0 ? `of ${campaign.goal} volunteers` : 'participants'}
              </p>
            </div>
          </div>
          
          {campaign.goal > 0 && (
            <div className="space-y-2">
              <Progress value={progressPercentage} className="h-3" />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{Math.round(progressPercentage)}% completed</span>
                <span>{Math.max(0, campaign.goal - campaign.progress)} more needed</span>
              </div>
            </div>
          )}
        </div>

        {/* Join Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleJoin}
            disabled={isEventEnded}
            className={`px-8 py-3 text-lg ${
              isParticipant
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
            size="lg"
          >
            {isEventEnded ? (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Event Completed
              </>
            ) : isParticipant ? (
              'Leave Campaign'
            ) : (
              <>
                <Users className="h-5 w-5 mr-2" />
                Join Campaign
              </>
            )}
          </Button>
        </div>

        {/* Participants Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Participants ({participantsCount})</span>
            </h4>
            {participantsCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowParticipants(!showParticipants)}
              >
                {showParticipants ? 'Hide' : 'Show'} All
              </Button>
            )}
          </div>

          {participantsCount > 0 ? (
            <div>
              {/* Show first few participants */}
              <div className="flex flex-wrap gap-2 mb-3">
                {campaign.participants?.slice(0, showParticipants ? undefined : 10).map((participant) => (
                  <div
                    key={participant._id}
                    className="flex items-center space-x-2 bg-green-50 rounded-full px-3 py-1"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={participant.avatar} alt={(participant.firstName || participant.name || 'User')} />
                      <AvatarFallback className="text-xs bg-emerald-200 text-emerald-800">
                        {(participant.firstName || participant.name || 'U')?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-green-900">
                      {participant.firstName && participant.lastName
                        ? `${participant.firstName} ${participant.lastName}`
                        : participant.firstName || participant.name || 'User'}
                    </span>
                  </div>
                ))}
              </div>
              
              {!showParticipants && participantsCount > 10 && (
                <p className="text-sm text-gray-500">
                  and {participantsCount - 10} more participants...
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No participants yet. Be the first to join!
            </p>
          )}
        </div>

        {/* Comments Section */}
        <Separator className="my-6" />
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center space-x-2">
            <MessageCircle className="h-4 w-4" />
            <span>Comments ({campaign.comments?.length || 0})</span>
          </h4>
          
          {/* Comment Form */}
          {currentUser && (
            <form onSubmit={handleComment} className="flex space-x-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isSubmittingComment}
              />
              <Button
                type="submit"
                disabled={!newComment.trim() || isSubmittingComment}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}
          
          {/* Comments List */}
          {campaign.comments && campaign.comments.length > 0 ? (
            <div className="space-y-3">
              {campaign.comments.map((comment, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={comment.user?.avatar} alt={comment.user?.firstName || comment.user?.name} />
                    <AvatarFallback className="bg-purple-200 text-purple-800 text-xs">
                      {(comment.user?.firstName || comment.user?.name || 'U')?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {comment.user?.firstName && comment.user?.lastName
                          ? `${comment.user.firstName} ${comment.user.lastName}`
                          : comment.user?.firstName || comment.user?.name || 'User'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>

        {/* Status Message */}
        {isEventEnded && (
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-gray-700 font-medium">This campaign has ended</p>
            <p className="text-sm text-gray-500">
              Thank you to all {participantsCount} participants who joined this initiative!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommunityCampaign;
