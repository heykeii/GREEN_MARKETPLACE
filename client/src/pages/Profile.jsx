import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import noProfile  from '@/assets/no_profile.jpg';
import axios from 'axios';
import { toast } from 'react-toastify';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    contactNumber: '',
    location: {
      address: '',
      city: '',
      province: '',
      zipCode: '',
    },
    socialLinks: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load user from localStorage
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (!storedUser) {
      setUser(false); // not logged in
      return;
    }
    setUser(storedUser);
    setForm({
      firstName: storedUser.firstName || '',
      lastName: storedUser.lastName || '',
      bio: storedUser.bio || '',
      contactNumber: storedUser.contactNumber || '',
      location: {
        address: storedUser.location?.address || '',
        city: storedUser.location?.city || '',
        province: storedUser.location?.province || '',
        zipCode: storedUser.location?.zipCode || '',
      },
      socialLinks: storedUser.socialLinks || [],
    });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e) => {
    // Implementation of handleAvatarChange
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        bio: form.bio,
        contactNumber: form.contactNumber,
        location: form.location,
        socialLinks: form.socialLinks,
      };
      // If avatar upload is implemented, handle it here (not included in this basic version)
      const res = await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/v1/users/profile`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Update localStorage and state
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setEditMode(false);
      toast.success(res.data.message || 'Profile updated!');
    } catch (error) {
      console.error('Error saving profile:', error);
      const msg = error.response?.data?.message || 'Failed to update profile.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLinkChange = (index, field, value) => {
    // Implementation of handleSocialLinkChange
  };

  const removeSocialLink = (index) => {
    // Implementation of removeSocialLink
  };

  const addSocialLink = () => {
    // Implementation of addSocialLink
  };

  if (user === false) {
    return <div className="min-h-screen flex items-center justify-center">You must be signed in to view your profile.</div>;
  }
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        {/* Profile Summary Section */}
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <img
              src={user.avatar || noProfile}
              alt="avatar"
              className="w-24 h-24 rounded-full object-cover border border-green-300"
            />
            <div className="text-2xl font-bold text-green-800">{user.firstName} {user.lastName}</div>
            <div className="text-gray-700 text-sm">Email: <span className="font-semibold">{user.email}</span></div>
            <div className="text-gray-700 text-sm">Role: <span className="font-semibold">{user.role}</span></div>
            <div className="text-gray-700 text-sm">Seller Status: <span className="font-semibold">{user.sellerStatus}</span></div>
            {typeof user.profileCompletion === 'number' && (
              <div className="w-full max-w-xs mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Profile Completion</span>
                  <span>{user.profileCompletion}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${user.profileCompletion}%` }}
                  ></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Editable Form Section */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 mb-6">
              {editMode && (
                <div>
                  <Label htmlFor="avatar">Change Avatar</Label>
                  <Input id="avatar" name="avatar" type="file" accept="image/*" onChange={handleAvatarChange} />
                </div>
              )}
            </div>
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    required
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleInputChange}
                    disabled={!editMode}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  name="bio"
                  value={form.bio}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  placeholder="Tell us about yourself"
                />
              </div>
              <div>
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input
                  id="contactNumber"
                  name="contactNumber"
                  value={form.contactNumber}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  placeholder="e.g. +639123456789"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="location.address"
                    value={form.location.address}
                    onChange={handleInputChange}
                    disabled={!editMode}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="location.city"
                    value={form.location.city}
                    onChange={handleInputChange}
                    disabled={!editMode}
                  />
                </div>
                <div>
                  <Label htmlFor="province">Province</Label>
                  <Input
                    id="province"
                    name="location.province"
                    value={form.location.province}
                    onChange={handleInputChange}
                    disabled={!editMode}
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input
                    id="zipCode"
                    name="location.zipCode"
                    value={form.location.zipCode}
                    onChange={handleInputChange}
                    disabled={!editMode}
                  />
                </div>
              </div>
              <div>
                <Label>Social Links</Label>
                {form.socialLinks.map((link, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <select
                      value={link.platform}
                      onChange={e => handleSocialLinkChange(idx, 'platform', e.target.value)}
                      disabled={!editMode}
                      className="border rounded px-2 py-1"
                    >
                      <option value="website">Website</option>
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="twitter">Twitter</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="youtube">YouTube</option>
                      <option value="tiktok">TikTok</option>
                      <option value="pinterest">Pinterest</option>
                      <option value="snapchat">Snapchat</option>
                      <option value="discord">Discord</option>
                      <option value="telegram">Telegram</option>
                      <option value="other">Other</option>
                    </select>
                    <Input
                      value={link.url}
                      onChange={e => handleSocialLinkChange(idx, 'url', e.target.value)}
                      disabled={!editMode}
                      placeholder="URL"
                    />
                    <Input
                      value={link.displayName}
                      onChange={e => handleSocialLinkChange(idx, 'displayName', e.target.value)}
                      disabled={!editMode}
                      placeholder="Display Name"
                    />
                    {editMode && (
                      <Button type="button" variant="destructive" onClick={() => removeSocialLink(idx)}>-</Button>
                    )}
                  </div>
                ))}
                {editMode && (
                  <Button type="button" onClick={addSocialLink} className="mt-2">Add Social Link</Button>
                )}
              </div>
              <div className="flex gap-4 mt-6">
                {editMode ? (
                  <>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
                    <Button type="button" variant="secondary" onClick={() => setEditMode(false)} disabled={loading}>Cancel</Button>
                  </>
                ) : (
                  <Button type="button" onClick={() => setEditMode(true)} className="bg-green-600 hover:bg-green-700">Edit Profile</Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile; 