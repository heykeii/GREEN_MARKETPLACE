import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, Plus, X } from 'lucide-react';
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
    featuredBusinesses: [],
    objectives: []
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [businessSearch, setBusinessSearch] = useState('');
  const [availableBusinesses, setAvailableBusinesses] = useState([]);
  const [searchingBusinesses, setSearchingBusinesses] = useState(false);

  // Ensure at least one objective field for community campaigns
  useEffect(() => {
    if (formData.type === 'community' && (!formData.objectives || formData.objectives.length === 0)) {
      setFormData(prev => ({ ...prev, objectives: [''] }));
    }
  }, [formData.type]);

  // Redirect if not authenticated
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

  const searchBusinesses = async (query) => {
    if (!query || query.length < 2) {
      setAvailableBusinesses([]);
      return;
    }

    try {
      setSearchingBusinesses(true);
      const response = await axios.get(`/api/v1/users/sellers?search=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setAvailableBusinesses(response.data.sellers || []);
      }
    } catch (error) {
      console.error('Error searching businesses:', error);
    } finally {
      setSearchingBusinesses(false);
    }
  };

  const addBusiness = (business) => {
    if (!formData.featuredBusinesses.find(b => b._id === business._id)) {
      setFormData(prev => ({
        ...prev,
        featuredBusinesses: [...prev.featuredBusinesses, business]
      }));
    }
    setBusinessSearch('');
    setAvailableBusinesses([]);
  };

  const handleObjectiveChange = (index, value) => {
    setFormData(prev => {
      const next = [...(prev.objectives || [])];
      next[index] = value;
      // Auto-add next empty field when last is filled
      if (index === next.length - 1 && value.trim() !== '' && next.length < 20) {
        next.push('');
      }
      // Collapse excess trailing empties (keep single at end)
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

  const removeBusiness = (businessId) => {
    setFormData(prev => ({
      ...prev,
      featuredBusinesses: prev.featuredBusinesses.filter(b => b._id !== businessId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.type || ((mediaFiles.length === 0) && !formData.image)) {
      toast.error('Please fill in all required fields (media is required)');
      return;
    }

    // Frontend date validation for community campaigns
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
        form.append('featuredBusinesses', JSON.stringify(formData.featuredBusinesses.map(b => b._id)));
        if (formData.type === 'community' && formData.objectives?.length) {
          formData.objectives
            .map(o => (o || '').trim())
            .filter(Boolean)
            .slice(0,20)
            .forEach((obj) => form.append('objectives', obj));
        }
        mediaFiles.slice(0,10).forEach((file) => form.append('media', file));

        response = await axios.post('/api/campaigns/create', form, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        const submitData = {
          ...formData,
          goal: formData.goal ? parseInt(formData.goal) : undefined,
          featuredBusinesses: formData.featuredBusinesses.map(b => b._id),
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          objectives: formData.type === 'community' 
            ? formData.objectives?.map(o => (o || '').trim()).filter(Boolean)
            : undefined
        };
        response = await axios.post('/api/campaigns/create', submitData, {
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

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-gray-50 py-8 pt-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/campaigns">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>
          <p className="mt-2 text-gray-600">
            Start a new eco-friendly initiative and engage your community
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Campaign Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter campaign title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your campaign..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="type">Campaign Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select campaign type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="awareness">Awareness Campaign</SelectItem>
                      <SelectItem value="promotional">Promotional Campaign</SelectItem>
                      <SelectItem value="community">Community Campaign</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.type === 'awareness' && 'Spread eco-awareness with social features like likes and comments'}
                    {formData.type === 'promotional' && 'Highlight eco-businesses and their products'}
                    {formData.type === 'community' && 'Organize community events and track participation'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="media">Campaign Media (up to 10 images)</Label>
                  <div className="mt-2 grid gap-3">
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
                      className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 border border-gray-200 rounded-lg"
                    />
                    {mediaPreviews.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {mediaPreviews.map((src, idx) => (
                          <img key={idx} src={src} alt="preview" className="w-full h-40 object-cover rounded-lg border" />
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">Upload up to 10 images. The first image becomes the cover.</p>
                  </div>
                </div>
              </div>

              {/* Date Range - only for community campaigns */}
              {formData.type === 'community' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Event Start Date</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  max={formData.endDate || undefined}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">Event End Date</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  min={formData.startDate || undefined}
                    />
                  </div>
                </div>
              )}

              {/* Type-specific fields */}
              {formData.type === 'community' && (
                <div>
                  <Label htmlFor="goal">Participation Goal</Label>
                  <Input
                    id="goal"
                    type="number"
                    min="1"
                    value={formData.goal}
                    onChange={(e) => handleInputChange('goal', e.target.value)}
                    placeholder="e.g., 100 volunteers"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Target number of participants for this community campaign
                  </p>
                  <div className="mt-4 space-y-2">
                    <Label>Objectives</Label>
                    {(formData.objectives && formData.objectives.length > 0 ? formData.objectives : ['']).map((obj, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          value={obj}
                          onChange={(e) => handleObjectiveChange(idx, e.target.value)}
                          placeholder={`Objective #${idx + 1}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeObjectiveField(idx)}
                          disabled={formData.objectives && formData.objectives.length <= 1}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <div className="flex justify-end">
                      <Button type="button" variant="outline" size="sm" onClick={addObjectiveField} disabled={(formData.objectives?.length || 0) >= 20}>
                        + Add objective
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">Only for community campaigns. Up to 20 objectives. A new field appears automatically as you fill the last one.</p>
                  </div>
                </div>
              )}

              {formData.type === 'promotional' && (
                <div>
                  <Label>Featured Businesses (Optional)</Label>
                  <div className="space-y-3">
                    {/* Business Search */}
                    <div className="relative">
                      <Input
                        value={businessSearch}
                        onChange={(e) => {
                          setBusinessSearch(e.target.value);
                          searchBusinesses(e.target.value);
                        }}
                        placeholder="Search for eco-businesses to feature..."
                      />
                      {availableBusinesses.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                          {availableBusinesses.map((business) => (
                            <button
                              key={business._id}
                              type="button"
                              onClick={() => addBusiness(business)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0"
                            >
                              <div className="font-medium">{business.businessName || business.name}</div>
                              <div className="text-sm text-gray-500">{business.email}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Selected Businesses */}
                    {formData.featuredBusinesses.length > 0 && (
                      <div className="space-y-2">
                        <Label>Selected Businesses:</Label>
                        {formData.featuredBusinesses.map((business) => (
                          <div key={business._id} className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                            <div>
                              <div className="font-medium">{business.businessName || business.name}</div>
                              <div className="text-sm text-gray-500">{business.email}</div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBusiness(business._id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Optional URL fallback */}
              <div>
                <Label htmlFor="image">Or paste a media URL (optional)</Label>
                <Input
                  id="image"
                  type="url"
                  value={formData.image}
                  onChange={(e) => handleInputChange('image', e.target.value)}
                  placeholder="https://example.com/media.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">If a file is uploaded above, this URL will be ignored.</p>
              </div>

              {/* Important Note */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-1">Admin Verification Required</h4>
                <p className="text-sm text-yellow-700">
                  Your campaign will be submitted for admin review and will only be visible to users after verification.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Creating...' : 'Create Campaign'}
                </Button>
                <Link to="/campaigns">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default CreateCampaign;
