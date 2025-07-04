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
  const [avatarFile, setAvatarFile] = useState(null);
  const [initialForm, setInitialForm] = useState(null);

  useEffect(() => {
    // Load user from localStorage
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (!storedUser) {
      setUser(false); // not logged in
      return;
    }
    setUser(storedUser);
    const formObj = {
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
    };
    setForm(formObj);
    setInitialForm(formObj);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Handle nested location fields
    if (name.startsWith('location.')) {
      const locField = name.split('.')[1];
      setForm(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locField]: value,
        },
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
    setAvatarFile(null);
    // Reset form to latest user data in case user canceled before
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (storedUser) {
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
      setInitialForm({
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
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setAvatarFile(null);
    if (initialForm) setForm(initialForm);
  };

  function isFormChanged() {
    // Compare form and initialForm deeply
    if (!initialForm) return false;
    const f = form;
    const i = initialForm;
    const locEq = Object.keys(f.location).every(k => f.location[k] === i.location[k]);
    const linksEq = f.socialLinks.length === i.socialLinks.length && f.socialLinks.every((l, idx) => {
      const il = i.socialLinks[idx];
      return l.platform === il.platform && l.url === il.url && l.displayName === il.displayName;
    });
    return !(
      f.firstName === i.firstName &&
      f.lastName === i.lastName &&
      f.bio === i.bio &&
      f.contactNumber === i.contactNumber &&
      locEq &&
      linksEq &&
      !avatarFile
    );
  }

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('firstName', form.firstName);
      formData.append('lastName', form.lastName);
      formData.append('bio', form.bio);
      formData.append('contactNumber', form.contactNumber);
      // Always append all location fields, even if blank
      formData.append('location[address]', form.location.address || '');
      formData.append('location[city]', form.location.city || '');
      formData.append('location[province]', form.location.province || '');
      formData.append('location[zipCode]', form.location.zipCode || '');
      // Always append all social links, even if blank
      form.socialLinks.forEach((link, idx) => {
        formData.append(`socialLinks[${idx}][platform]`, link.platform || '');
        formData.append(`socialLinks[${idx}][url]`, link.url || '');
        formData.append(`socialLinks[${idx}][displayName]`, link.displayName || '');
      });
      // Avatar file if selected
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/v1/users/update-profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      // Update localStorage and state
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setEditMode(false);
      setAvatarFile(null);
      // Update initialForm to new values
      const newForm = {
        firstName: res.data.user.firstName || '',
        lastName: res.data.user.lastName || '',
        bio: res.data.user.bio || '',
        contactNumber: res.data.user.contactNumber || '',
        location: {
          address: res.data.user.location?.address || '',
          city: res.data.user.location?.city || '',
          province: res.data.user.location?.province || '',
          zipCode: res.data.user.location?.zipCode || '',
        },
        socialLinks: res.data.user.socialLinks || [],
      };
      setForm(newForm);
      setInitialForm(newForm);
      if (isFormChanged()) {
        toast.success(res.data.message || 'Profile updated!');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      const msg = error.response?.data?.message || 'Failed to update profile.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLinkChange = (index, field, value) => {
    setForm(prev => {
      const updatedLinks = prev.socialLinks.map((link, idx) =>
        idx === index ? { ...link, [field]: value } : link
      );
      return { ...prev, socialLinks: updatedLinks };
    });
  };

  const removeSocialLink = (index) => {
    setForm(prev => {
      const updatedLinks = prev.socialLinks.filter((_, idx) => idx !== index);
      return { ...prev, socialLinks: updatedLinks };
    });
  };

  const addSocialLink = () => {
    setForm(prev => ({
      ...prev,
      socialLinks: [
        ...prev.socialLinks,
        { platform: 'website', url: '', displayName: '' },
      ],
    }));
  };

  if (user === false) {
    return <div className="min-h-screen flex items-center justify-center">You must be signed in to view your profile.</div>;
  }
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white bg-gradient-to-br from-green-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl flex flex-col gap-8">
        {/* Profile Summary Section */}
        <Card className="shadow-xl border-green-200 bg-white/90">
          <CardContent className="flex flex-col md:flex-row items-center gap-8 py-10">
            <div className="flex flex-col items-center gap-4 md:w-1/3">
              <img
                src={user.avatar || noProfile}
                alt="avatar"
                className="w-32 h-32 rounded-full object-cover border-4 border-green-300 shadow-lg"
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
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${user.profileCompletion}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1 w-full">
              <Card className="bg-white/80 border-green-100 shadow-none">
                <CardHeader>
                  <CardTitle className="text-green-700 text-xl font-semibold">Edit Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-4 mb-6">
                    {editMode && (
                      <div className="w-full flex flex-col items-center gap-2">
                        <Label htmlFor="avatar">Change Avatar</Label>
                        <Input id="avatar" name="avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="w-full" />
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
                          className="bg-green-50 border-green-200 focus:ring-green-600 focus:border-green-600"
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
                          className="bg-green-50 border-green-200 focus:ring-green-600 focus:border-green-600"
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
                        className="bg-green-50 border-green-200 focus:ring-green-600 focus:border-green-600"
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
                        className="bg-green-50 border-green-200 focus:ring-green-600 focus:border-green-600"
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
                          className="bg-green-50 border-green-200 focus:ring-green-600 focus:border-green-600"
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
                          className="bg-green-50 border-green-200 focus:ring-green-600 focus:border-green-600"
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
                          className="bg-green-50 border-green-200 focus:ring-green-600 focus:border-green-600"
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
                          className="bg-green-50 border-green-200 focus:ring-green-600 focus:border-green-600"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Social Links</Label>
                      {form.socialLinks.map((link, idx) => (
                        <div key={idx} className="flex gap-2 mb-2 items-center">
                          <select
                            value={link.platform}
                            onChange={e => handleSocialLinkChange(idx, 'platform', e.target.value)}
                            disabled={!editMode}
                            className="border rounded px-2 py-1 bg-green-50 border-green-200 focus:ring-green-600 focus:border-green-600"
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
                            className="bg-green-50 border-green-200 focus:ring-green-600 focus:border-green-600"
                          />
                          <Input
                            value={link.displayName}
                            onChange={e => handleSocialLinkChange(idx, 'displayName', e.target.value)}
                            disabled={!editMode}
                            placeholder="Display Name"
                            className="bg-green-50 border-green-200 focus:ring-green-600 focus:border-green-600"
                          />
                          {editMode && (
                            <Button type="button" variant="destructive" onClick={() => removeSocialLink(idx)}>-</Button>
                          )}
                        </div>
                      ))}
                      {editMode && (
                        <Button type="button" onClick={addSocialLink} className="mt-2 bg-green-100 text-green-700 hover:bg-green-200">Add Social Link</Button>
                      )}
                    </div>
                    <div className="flex gap-4 mt-8 justify-end">
                      {editMode ? (
                        <>
                          <Button type="submit" className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold shadow-md" disabled={loading || !isFormChanged()}>{loading ? 'Saving...' : 'Save'}</Button>
                          <Button type="button" variant="secondary" onClick={handleCancel} disabled={loading}>Cancel</Button>
                        </>
                      ) : (
                        <Button type="button" onClick={handleEdit} className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold shadow-md">Edit Profile</Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile; 