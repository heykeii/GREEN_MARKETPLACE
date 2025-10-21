import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, Plus, X, Image as ImageIcon, Calendar, Target, Users, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { toast } from '@/utils/toast';

const CreateCampaign = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    if (formData.type === 'community' && (!formData.objectives || formData.objectives.length === 0)) {
      setFormData(prev => ({ ...prev, objectives: [''] }));
    }
  }, [formData.type]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Featured businesses removed for promotional campaigns

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
    
    if (!formData.title || !formData.type || ((mediaFiles.length === 0) && !formData.image)) {
      toast.error('Please fill in all required fields (media is required)');
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
      setLoading(true);
      let response;
      if (mediaFiles.length > 0) {
        const form = new FormData();
        form.append('title', formData.title);
        form.append('description', formData.description);
        form.append('type', formData.type);
        if (formData.startDate) form.append('startDate', formData.startDate);
        if (formData.endDate) form.append('endDate', formData.endDate);
        if (formData.goal) form.append('goal', String(parseInt(formData.goal)));
        if (formData.type === 'community' && formData.objectives?.length) {
          formData.objectives
            .map(o => (o || '').trim())
            .filter(Boolean)
            .slice(0,20)
            .forEach((obj) => form.append('objectives', obj));
        }
        mediaFiles.slice(0,10).forEach((file) => form.append('media', file));

        response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/campaigns/create`, form, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        const submitData = {
          ...formData,
          goal: formData.goal ? parseInt(formData.goal) : undefined,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          objectives: formData.type === 'community' 
            ? formData.objectives?.map(o => (o || '').trim()).filter(Boolean)
            : undefined
        };
        response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/campaigns/create`, submitData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
      }

      if (response.data.success) {
        toast.success('Campaign created successfully! Pending admin verification.');
        navigate('/campaigns');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error(error.response?.data?.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const getCampaignTypeIcon = (type) => {
    switch(type) {
      case 'awareness': return <Sparkles className="h-5 w-5" />;
      case 'promotional': return <Target className="h-5 w-5" />;
      case 'community': return <Users className="h-5 w-5" />;
      default: return null;
    }
  };

  const getCampaignTypeColor = (type) => {
    switch(type) {
      case 'awareness': return 'from-blue-500 to-cyan-500';
      case 'promotional': return 'from-purple-500 to-pink-500';
      case 'community': return 'from-green-500 to-emerald-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-blue-50/20 py-6 sm:py-8 pt-24">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <Link to="/campaigns">
            <Button variant="ghost" className="mb-6 hover:bg-white/80 transition-all duration-200">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
          <div className="relative">
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl"></div>
            <div className="relative">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-green-800 to-green-900 bg-clip-text text-transparent">
                Create New Campaign
              </h1>
              <p className="mt-3 text-gray-600 text-lg">
                Launch an eco-initiative and inspire your community to take action
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          {/* Decorative elements */}
          <div className="absolute top-20 right-0 w-64 h-64 bg-gradient-to-br from-green-200/30 to-transparent rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-40 left-0 w-48 h-48 bg-gradient-to-br from-blue-200/30 to-transparent rounded-full blur-3xl -z-10"></div>

          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-green-50/50 to-blue-50/50">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                Campaign Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-1 w-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      Campaign Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Give your campaign a compelling name..."
                      required
                      className="border-gray-200 focus:border-green-500 focus:ring-green-500 h-12 text-base transition-all duration-200"
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
                      placeholder="Share the story and vision behind your campaign..."
                      rows={5}
                      className="border-gray-200 focus:border-green-500 focus:ring-green-500 resize-none transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      Campaign Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                      <SelectTrigger className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500 transition-all duration-200">
                        <SelectValue placeholder="Choose the type of campaign" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="awareness" className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                              <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <div className="font-medium">Awareness Campaign</div>
                              <div className="text-xs text-gray-500">Spread eco-awareness with social engagement</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="promotional" className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                              <Target className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <div className="font-medium">Promotional Campaign</div>
                              <div className="text-xs text-gray-500">Highlight eco-businesses and products</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="community" className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                              <Users className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <div className="font-medium">Community Campaign</div>
                              <div className="text-xs text-gray-500">Organize events and track participation</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.type && (
                      <div className={`mt-3 p-4 rounded-xl bg-gradient-to-r ${getCampaignTypeColor(formData.type)} bg-opacity-10 border border-opacity-20`}>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 bg-gradient-to-br ${getCampaignTypeColor(formData.type)} rounded-lg flex-shrink-0`}>
                            {getCampaignTypeIcon(formData.type)}
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {formData.type === 'awareness' && 'Perfect for spreading environmental awareness! Your campaign will feature social interactions like likes, comments, and shares to maximize reach.'}
                            {formData.type === 'promotional' && 'Showcase eco-friendly businesses and their sustainable products. Connect conscious consumers with green enterprises.'}
                            {formData.type === 'community' && 'Bring people together for environmental action! Set participation goals and organize impactful community events.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Media Upload Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-1 w-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-800">Campaign Media</h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="media" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      Upload Images <span className="text-red-500">*</span>
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
                        className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gradient-to-br from-gray-50 to-green-50/30 hover:from-green-50 hover:to-blue-50/30 transition-all duration-300 group"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300">
                            <Upload className="h-8 w-8 text-white" />
                          </div>
                          <p className="mb-2 text-sm text-gray-700 font-medium">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG or WEBP (MAX. 10 images)</p>
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
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {mediaPreviews.map((src, idx) => (
                            <div key={idx} className="relative group">
                              <div className="relative aspect-square overflow-hidden rounded-xl border-2 border-gray-200 shadow-md">
                                <img 
                                  src={src} 
                                  alt={`Preview ${idx + 1}`} 
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                                />
                                {idx === 0 && (
                                  <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-semibold rounded-full">
                                    Cover
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                          💡 <span className="font-medium">Pro tip:</span> The first image will be your campaign cover. Choose wisely!
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label htmlFor="image" className="text-sm font-medium text-gray-700">
                      Or use a media URL (optional)
                    </Label>
                    <Input
                      id="image"
                      type="url"
                      value={formData.image}
                      onChange={(e) => handleInputChange('image', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="border-gray-200 focus:border-green-500 focus:ring-green-500 h-11"
                    />
                    <p className="text-xs text-gray-500 italic">Uploaded files take priority over URL</p>
                  </div>
                </div>

                {/* Community Campaign Specific Fields */}
                {formData.type === 'community' && (
                  <div className="space-y-6 bg-gradient-to-br from-green-50/50 to-emerald-50/30 rounded-xl p-6 border border-green-100">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-1 w-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-green-600" />
                        Event Details
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          className="border-gray-200 focus:border-green-500 focus:ring-green-500 h-11"
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
                          className="border-gray-200 focus:border-green-500 focus:ring-green-500 h-11"
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
                        className="border-gray-200 focus:border-green-500 focus:ring-green-500 h-11"
                      />
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        Set a target number to inspire participation
                      </p>
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
                                className="border-gray-200 focus:border-green-500 focus:ring-green-500 h-11 pl-10"
                              />
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">
                                {idx + 1}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeObjectiveField(idx)}
                              disabled={formData.objectives && formData.objectives.length <= 1}
                              className="h-11 px-3 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={addObjectiveField} 
                        disabled={(formData.objectives?.length || 0) >= 20}
                        className="w-full border-dashed border-2 hover:border-green-500 hover:bg-green-50 transition-colors h-11"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Objective
                      </Button>
                      <p className="text-xs text-gray-500 bg-white/80 rounded-lg p-3 border border-gray-200">
                        💡 Define up to 20 clear objectives. New fields appear automatically as you type.
                      </p>
                    </div>
                  </div>
                )}

                {/* Promotional Campaign business-selection removed per request */}

                {/* Admin Verification Notice */}
                <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-300/20 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-900 text-lg mb-2">Admin Review Required</h4>
                      <p className="text-sm text-amber-800 leading-relaxed">
                        Your campaign will be carefully reviewed by our admin team to ensure it meets our quality standards and community guidelines. Once approved, it will be visible to all users and ready to make an impact!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Creating Campaign...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Create Campaign
                      </span>
                    )}
                  </Button>
                  <Link to="/campaigns" className="flex-1 sm:flex-initial">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full h-12 text-base font-medium border-2 hover:bg-gray-50 transition-all duration-200"
                    >
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Spacing */}
        <div className="h-12"></div>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default CreateCampaign;