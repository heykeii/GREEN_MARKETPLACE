import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, Calendar, Target, Users, Upload, X, Plus, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import axios from 'axios';
import { toast } from '@/utils/toast';
import { AuthContext } from '../context/AuthContext';

const EditCampaign = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: contextUser } = useContext(AuthContext);

  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    startDate: '',
    endDate: '',
    image: '',
    goal: '',
    objectives: []
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);

  // Resolve user (from context or localStorage)
  useEffect(() => {
    if (contextUser) {
      setUser(contextUser);
      setAuthChecked(true);
      return;
    }
    try {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
      }
    } catch (_) {}
    setAuthChecked(true);
  }, [contextUser]);

  // Redirect unauthenticated users
  useEffect(() => {
    if (authChecked && !user) {
      navigate('/login');
    }
  }, [authChecked, user, navigate]);

  // Fetch existing campaign
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/campaigns/${id}`);
        const campaign = res.data?.campaign;
        if (!campaign) throw new Error('Not found');

        // Authorization: allow admin or creator only
        const currentUserId = (contextUser?._id || contextUser?.id) || (user?._id || user?.id);
        const createdById = campaign.createdBy?._id || campaign.createdBy?.id;
        const isAdmin = (contextUser?.role || user?.role) === 'admin';
        const isCreator = currentUserId && String(createdById) === String(currentUserId);
        if (!isAdmin && !isCreator) {
          toast.error('You are not allowed to edit this campaign');
          navigate(`/campaigns/${id}`);
          return;
        }

        const objectives = Array.isArray(campaign.objectives) && campaign.objectives.length 
          ? campaign.objectives 
          : (campaign.type === 'community' ? [''] : []);

        setFormData({
          title: campaign.title || '',
          description: campaign.description || '',
          type: campaign.type || '',
          startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().slice(0,16) : '',
          endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().slice(0,16) : '',
          image: campaign.image || '',
          goal: campaign.goal ? String(campaign.goal) : '',
          objectives
        });
      } catch (err) {
        toast.error('Failed to load campaign');
        navigate('/campaigns');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCampaign();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Ensure objectives is initialized for community campaigns
  useEffect(() => {
    if (formData.type === 'community' && (!formData.objectives || formData.objectives.length === 0)) {
      setFormData(prev => ({ ...prev, objectives: [''] }));
    }
  }, [formData.type]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleObjectiveChange = (index, value) => {
    setFormData(prev => {
      const next = [...(prev.objectives || [])];
      next[index] = value;
      if (index === next.length - 1 && value.trim() !== '' && next.length < 20) {
        next.push('');
      }
      while (next.length > 1 && next[next.length - 1] === '' && next[next.length - 2] === '') {
        next.pop();
      }
      return { ...prev, objectives: next };
    });
  };

  const addObjectiveField = () => {
    setFormData(prev => ({ ...prev, objectives: [ ...(prev.objectives || []), '' ] }));
  };

  const removeObjectiveField = (index) => {
    setFormData(prev => {
      const next = [...(prev.objectives || [])];
      next.splice(index, 1);
      if (next.length === 0) next.push('');
      return { ...prev, objectives: next };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.type) {
      toast.error('Please fill in required fields');
      return;
    }

    if (formData.type === 'community' && formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start.getTime() > end.getTime()) {
        toast.error('Start date cannot be after end date');
        return;
      }
    }

    try {
      setSaving(true);
      let response;
      
      if (mediaFiles.length > 0) {
        // Use FormData if new files are uploaded
        const form = new FormData();
        form.append('title', formData.title);
        form.append('description', formData.description);
        form.append('type', formData.type);
        if (formData.type === 'community') {
          if (formData.startDate) form.append('startDate', formData.startDate);
          if (formData.endDate) form.append('endDate', formData.endDate);
          if (formData.goal) form.append('goal', String(parseInt(formData.goal)));
          if (formData.objectives?.length) {
            formData.objectives
              .map(o => (o || '').trim())
              .filter(Boolean)
              .slice(0,20)
              .forEach((obj) => form.append('objectives', obj));
          }
        }
        mediaFiles.slice(0,10).forEach((file) => form.append('media', file));

        response = await axios.put(`${import.meta.env.VITE_API_URL}/api/v1/campaigns/${id}`, form, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Use JSON if no new files
        const submitData = {
          title: formData.title,
          description: formData.description,
          type: formData.type
        };
        
        // Only include community-specific fields for community campaigns
        if (formData.type === 'community') {
          submitData.startDate = formData.startDate || undefined;
          submitData.endDate = formData.endDate || undefined;
          submitData.goal = formData.goal ? parseInt(formData.goal) : undefined;
          submitData.objectives = (formData.objectives || []).map(o => (o || '').trim()).filter(Boolean);
        }

        response = await axios.put(`${import.meta.env.VITE_API_URL}/api/v1/campaigns/${id}`,
          submitData,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
      }

      toast.success('Campaign updated successfully');
      navigate(`/campaigns/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update campaign');
    } finally {
      setSaving(false);
    }
  };

  if (!authChecked || !user) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-blue-50/20 py-4 sm:py-6 lg:py-8 pt-20 sm:pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <Link to={`/campaigns/${id}`}>
              <Button variant="ghost" className="mb-4 sm:mb-6 hover:bg-white/80 transition-all duration-200 text-sm sm:text-base">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden xs:inline">Back to Campaign</span>
                <span className="xs:hidden">Back</span>
              </Button>
            </Link>
            <div className="relative">
              <div className="absolute -top-2 sm:-top-4 -left-2 sm:-left-4 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-2 sm:-bottom-4 -right-2 sm:-right-4 w-20 sm:w-32 h-20 sm:h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl"></div>
              <div className="relative">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-green-800 to-green-900 bg-clip-text text-transparent leading-tight">
                  Edit Campaign
                </h1>
                <p className="mt-2 sm:mt-3 text-gray-600 text-base sm:text-lg">Update details and keep your campaign fresh</p>
              </div>
            </div>
          </div>

          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-green-50/50 to-blue-50/50 px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl lg:text-2xl">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                Campaign Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 sm:pt-8 px-4 sm:px-6">
              {loading ? (
                <div className="h-40 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded mb-4"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800">Basic Information</h3>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        Campaign Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Update the campaign name..."
                        required
                        className="border-gray-200 focus:border-green-500 focus:ring-green-500 h-11 sm:h-12 text-sm sm:text-base transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe the latest updates and goals..."
                        rows={4}
                        className="border-gray-200 focus:border-green-500 focus:ring-green-500 resize-none transition-all duration-200 text-sm sm:text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        Campaign Type
                      </Label>
                      <div className="relative">
                        <Select value={formData.type} disabled>
                          <SelectTrigger className="h-11 sm:h-12 border-gray-200 bg-gray-50 cursor-not-allowed opacity-75 text-sm sm:text-base">
                            <SelectValue placeholder="Campaign type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="awareness" className="py-3">💡 Awareness Campaign</SelectItem>
                            <SelectItem value="promotional" className="py-3">🏪 Promotional Campaign</SelectItem>
                            <SelectItem value="community" className="py-3">👥 Community Campaign</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="absolute inset-0 bg-gray-100/50 rounded-md pointer-events-none"></div>
                      </div>
                      <p className="text-xs text-gray-500 italic">Campaign type cannot be changed after creation</p>
                    </div>
                  </div>

                  {/* Community Campaign Specific Fields */}
                  {formData.type === 'community' && (
                    <div className="space-y-4 sm:space-y-6 bg-gradient-to-br from-green-50/50 to-emerald-50/30 rounded-xl p-4 sm:p-6 border border-green-100">
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                          Event Details
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">
                            Start Date & Time
                          </Label>
                          <Input
                            id="startDate"
                            type="datetime-local"
                            value={formData.startDate}
                            onChange={(e) => handleInputChange('startDate', e.target.value)}
                            max={formData.endDate || undefined}
                            className="border-gray-200 focus:border-green-500 focus:ring-green-500 h-11 text-sm sm:text-base"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endDate" className="text-sm font-medium text-gray-700">
                            End Date & Time
                          </Label>
                          <Input
                            id="endDate"
                            type="datetime-local"
                            value={formData.endDate}
                            onChange={(e) => handleInputChange('endDate', e.target.value)}
                            min={formData.startDate || undefined}
                            className="border-gray-200 focus:border-green-500 focus:ring-green-500 h-11 text-sm sm:text-base"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="goal" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-600" />
                          Participation Goal
                        </Label>
                        <Input
                          id="goal"
                          type="number"
                          min="1"
                          value={formData.goal}
                          onChange={(e) => handleInputChange('goal', e.target.value)}
                          placeholder="e.g., 100 volunteers"
                          className="border-gray-200 focus:border-green-500 focus:ring-green-500 h-11 text-sm sm:text-base"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Campaign Objectives
                        </Label>
                        <div className="space-y-2">
                          {(formData.objectives && formData.objectives.length > 0 ? formData.objectives : ['']).map((obj, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <div className="flex-1 relative">
                                <Input
                                  value={obj}
                                  onChange={(e) => handleObjectiveChange(idx, e.target.value)}
                                  placeholder={`Objective #${idx + 1} - What do you want to achieve?`}
                                  className="border-gray-200 focus:border-green-500 focus:ring-green-500 h-11 pl-8 sm:pl-10 text-sm sm:text-base"
                                />
                                <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-xs sm:text-sm">{idx + 1}</div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeObjectiveField(idx)}
                                disabled={formData.objectives && formData.objectives.length <= 1}
                                className="h-11 px-2 sm:px-3 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors flex-shrink-0"
                              >
                                <X className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addObjectiveField}
                          disabled={(formData.objectives?.length || 0) >= 20}
                          className="w-full border-dashed border-2 hover:border-green-500 hover:bg-green-50 transition-colors h-11 text-sm sm:text-base"
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                          Add Another Objective
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Media Upload Section */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800">Campaign Media</h3>
                    </div>

                    {/* Show current image if exists and no new files selected */}
                    {formData.image && mediaFiles.length === 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Current Cover Image</Label>
                        <div className="relative group">
                          <div className="relative aspect-video overflow-hidden rounded-xl border-2 border-gray-200 shadow-md">
                            <img 
                              src={formData.image} 
                              alt="Current cover" 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleInputChange('image', '')}
                            className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="media" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        {formData.image && mediaFiles.length === 0 ? 'Update Images' : 'Upload Images'}
                        <span className="text-xs text-gray-500 font-normal">(up to 10 images)</span>
                      </Label>
                      <div className="relative">
                        <input
                          id="media"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []).slice(0,10);
                            setMediaFiles(files);
                            setMediaPreviews(files.map(f => URL.createObjectURL(f)));
                          }}
                          className="hidden"
                        />
                        <label
                          htmlFor="media"
                          className="flex flex-col items-center justify-center w-full h-32 sm:h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gradient-to-br from-gray-50 to-green-50/30 hover:from-green-50 hover:to-blue-50/30 transition-all duration-300 group"
                        >
                          <div className="flex flex-col items-center justify-center pt-3 sm:pt-5 pb-4 sm:pb-6 px-4">
                            <div className="p-3 sm:p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
                              <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                            </div>
                            <p className="mb-1 sm:mb-2 text-xs sm:text-sm text-gray-700 font-medium text-center">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500 text-center">PNG, JPG or WEBP (MAX. 10 images)</p>
                          </div>
                        </label>
                      </div>
                      
                      {mediaPreviews.length > 0 && (
                        <div className="mt-6 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              {mediaPreviews.length} image{mediaPreviews.length > 1 ? 's' : ''} selected
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setMediaFiles([]);
                                setMediaPreviews([]);
                              }}
                              className="text-xs text-red-600 hover:text-red-700 font-medium"
                            >
                              Clear all
                            </button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                            {mediaPreviews.map((src, idx) => (
                              <div key={idx} className="relative group">
                                <div className="relative aspect-square overflow-hidden rounded-lg sm:rounded-xl border-2 border-gray-200 shadow-md">
                                  <img 
                                    src={src} 
                                    alt={`Preview ${idx + 1}`} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                                  />
                                  {idx === 0 && (
                                    <div className="absolute top-1 sm:top-2 left-1 sm:left-2 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-semibold rounded-full">
                                      Cover
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2 bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
                            💡 <span className="font-medium">Pro tip:</span> The first image will be your campaign cover. Choose wisely!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-3 sm:pt-4">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      {saving ? 'Saving changes...' : 'Save Changes'}
                    </Button>
                    <Link to={`/campaigns/${id}`} className="flex-1 sm:flex-initial">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full h-11 sm:h-12 text-sm sm:text-base font-medium border-2 hover:bg-gray-50 transition-all duration-200"
                      >
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="h-8 sm:h-12"></div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default EditCampaign;


