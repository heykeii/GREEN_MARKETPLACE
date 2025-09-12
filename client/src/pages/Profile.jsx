import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import noProfile from "@/assets/no_profile.jpg";
import axios from "axios";
import { toast } from "react-toastify";
import Navbar from "@/components/Navbar";
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin, FaYoutube, FaTiktok, FaPinterest, FaSnapchatGhost, FaDiscord, FaTelegramPlane, FaGlobe, FaLink } from 'react-icons/fa';
import Footer from '@/components/Footer';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [socialCounts, setSocialCounts] = useState({ followers: 0, following: 0 });
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    contactNumber: "",
    location: {
      address: "",
      city: "",
      province: "",
      zipCode: "",
    },
    socialLinks: [],
  });
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [initialForm, setInitialForm] = useState(null);
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  useEffect(() => {
    // Load user from localStorage
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    if (!storedUser) {
      setUser(false); // not logged in
      return;
    }
    setUser(storedUser);
    
    // Fetch latest user data from backend to ensure we have the most up-to-date info
    const fetchLatestUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/users/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const latestUser = response.data.user;
          localStorage.setItem("user", JSON.stringify(latestUser));
          setUser(latestUser);
          setSocialCounts({ followers: latestUser.followerCount || 0, following: latestUser.followingCount || 0 });
          
          // Update form with latest data
          const formObj = {
            firstName: latestUser.firstName || "",
            lastName: latestUser.lastName || "",
            bio: latestUser.bio || "",
            contactNumber: latestUser.contactNumber || "",
            location: {
              address: latestUser.location?.address || "",
              city: latestUser.location?.city || "",
              province: latestUser.location?.province || "",
              zipCode: latestUser.location?.zipCode || "",
            },
            socialLinks: latestUser.socialLinks || [],
          };
          setForm(formObj);
          setInitialForm(formObj);
        }
      } catch (error) {
        console.error("Error fetching latest user data:", error);
        // If fetch fails, use stored user data
        const formObj = {
          firstName: storedUser.firstName || "",
          lastName: storedUser.lastName || "",
          bio: storedUser.bio || "",
          contactNumber: storedUser.contactNumber || "",
          location: {
            address: storedUser.location?.address || "",
            city: storedUser.location?.city || "",
            province: storedUser.location?.province || "",
            zipCode: storedUser.location?.zipCode || "",
          },
          socialLinks: storedUser.socialLinks || [],
        };
        setForm(formObj);
        setInitialForm(formObj);
      }
    };
    
    fetchLatestUserData();

    // Fetch campaigns created by this user
    const fetchMyCampaigns = async () => {
      try {
        setLoadingCampaigns(true);
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`/api/campaigns/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success) {
          setMyCampaigns(res.data.campaigns || []);
        }
      } catch (e) {
        console.error('Error fetching my campaigns:', e);
      } finally {
        setLoadingCampaigns(false);
      }
    };
    fetchMyCampaigns();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Handle nested location fields
    if (name.startsWith("location.")) {
      const locField = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [locField]: value,
        },
      }));
    } else {
      setForm((prev) => ({
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
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    if (storedUser) {
      setForm({
        firstName: storedUser.firstName || "",
        lastName: storedUser.lastName || "",
        bio: storedUser.bio || "",
        contactNumber: storedUser.contactNumber || "",
        location: {
          address: storedUser.location?.address || "",
          city: storedUser.location?.city || "",
          province: storedUser.location?.province || "",
          zipCode: storedUser.location?.zipCode || "",
        },
        socialLinks: storedUser.socialLinks || [],
      });
      setInitialForm({
        firstName: storedUser.firstName || "",
        lastName: storedUser.lastName || "",
        bio: storedUser.bio || "",
        contactNumber: storedUser.contactNumber || "",
        location: {
          address: storedUser.location?.address || "",
          city: storedUser.location?.city || "",
          province: storedUser.location?.province || "",
          zipCode: storedUser.location?.zipCode || "",
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
    const locEq = Object.keys(f.location).every(
      (k) => f.location[k] === i.location[k]
    );
    const linksEq =
      f.socialLinks.length === i.socialLinks.length &&
      f.socialLinks.every((l, idx) => {
        const il = i.socialLinks[idx];
        return (
          l.platform === il.platform &&
          l.url === il.url &&
          l.displayName === il.displayName
        );
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
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("firstName", form.firstName);
      formData.append("lastName", form.lastName);
      formData.append("bio", form.bio);
      formData.append("contactNumber", form.contactNumber);
      // Always append all location fields, even if blank
      formData.append("location[address]", form.location.address || "");
      formData.append("location[city]", form.location.city || "");
      formData.append("location[province]", form.location.province || "");
      formData.append("location[zipCode]", form.location.zipCode || "");
      // Always append all social links, even if blank
      formData.append("socialLinks", JSON.stringify(form.socialLinks));

      // Avatar file if selected
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/v1/users/update-profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      // Update localStorage and state
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);
      setEditMode(false);
      setAvatarFile(null);
      // Update initialForm to new values
      const newForm = {
        firstName: res.data.user.firstName || "",
        lastName: res.data.user.lastName || "",
        bio: res.data.user.bio || "",
        contactNumber: res.data.user.contactNumber || "",
        location: {
          address: res.data.user.location?.address || "",
          city: res.data.user.location?.city || "",
          province: res.data.user.location?.province || "",
          zipCode: res.data.user.location?.zipCode || "",
        },
        socialLinks: res.data.user.socialLinks || [],
      };
      setForm(newForm);
      setInitialForm(newForm);
      if (isFormChanged()) {
        toast.success(res.data.message || "Profile updated!");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      const msg = error.response?.data?.message || "Failed to update profile.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLinkChange = (index, field, value) => {
    setForm((prev) => {
      const updatedLinks = prev.socialLinks.map((link, idx) =>
        idx === index ? { ...link, [field]: value } : link
      );
      return { ...prev, socialLinks: updatedLinks };
    });
  };

  const removeSocialLink = (index) => {
    setForm((prev) => {
      const updatedLinks = prev.socialLinks.filter((_, idx) => idx !== index);
      return { ...prev, socialLinks: updatedLinks };
    });
  };

  const addSocialLink = () => {
    setForm((prev) => ({
      ...prev,
      socialLinks: [
        ...prev.socialLinks,
        { platform: "website", url: "", displayName: "" },
      ],
    }));
  };

  // Helper function to get social platform icon (react-icons)
  const getSocialIcon = (platform) => {
    const iconMap = {
      website: <FaGlobe className="text-xl text-green-700" />,
      facebook: <FaFacebook className="text-xl text-blue-600" />,
      instagram: <FaInstagram className="text-xl text-pink-500" />,
      twitter: <FaTwitter className="text-xl text-sky-500" />,
      linkedin: <FaLinkedin className="text-xl text-blue-700" />,
      youtube: <FaYoutube className="text-xl text-red-600" />,
      tiktok: <FaTiktok className="text-xl text-black" />,
      pinterest: <FaPinterest className="text-xl text-red-500" />,
      snapchat: <FaSnapchatGhost className="text-xl text-yellow-400" />,
      discord: <FaDiscord className="text-xl text-indigo-500" />,
      telegram: <FaTelegramPlane className="text-xl text-blue-400" />,
      other: <FaLink className="text-xl text-green-700" />,
    };
    return iconMap[platform] || <FaLink className="text-xl text-green-700" />;
  };

  if (user === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <Card className="p-8 shadow-xl border-green-200">
          <CardContent className="text-center">
            <div className="text-green-700 text-lg font-semibold">
              You must be signed in to view your profile.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <Card className="p-8 shadow-xl border-green-200">
          <CardContent className="text-center">
            <div className="text-green-700 text-lg font-semibold animate-pulse">
              Loading...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Profile Summary Card - Left Side */}
            <div className="lg:col-span-1">
              <Card className="shadow-2xl border-green-200 bg-white/95 backdrop-blur-sm sticky top-8">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center space-y-6">
                    
                    {/* Avatar Section */}
                    <div className="relative group">
                      <div className="w-40 h-40 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 p-1 shadow-xl">
                        <img
                          src={user.avatar || noProfile}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = noProfile;
                          }}
                          alt="avatar"
                          className="w-full h-full rounded-full object-cover bg-white"
                        />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="text-center space-y-3">
                      <h1 className="text-2xl font-bold text-green-800">
                        {user.firstName} {user.lastName}
                      </h1>
                      <div className="px-4 py-2 bg-green-50 rounded-full">
                        <span className="text-green-700 text-sm font-medium">{user.email}</span>
                      </div>
                      
                      {/* Seller Badge */}
                      {user.sellerStatus === 'verified' && (
                        <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 text-sm font-semibold shadow-md">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Verified Seller
                        </Badge>
                      )}
                    </div>

                    {/* Bio */}
                    {user.bio && (
                      <div className="text-center">
                        <p className="text-green-700 text-sm italic px-4">{user.bio}</p>
                      </div>
                    )}

                    {/* Social Links */}
                    {user.socialLinks && user.socialLinks.length > 0 && (
                      <div className="w-full space-y-3">
                        <h4 className="text-green-800 font-semibold text-sm text-center">Social Links</h4>
                        <div className="space-y-2">
                          {user.socialLinks.map((link, index) => (
                            <a
                              key={index}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-full px-3 py-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                            >
                              <span className="text-lg mr-2">{getSocialIcon(link.platform)}</span>
                              <span className="text-green-700 text-sm font-medium group-hover:text-green-800 truncate">
                                {link.displayName || link.platform}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Social counts */}
                    <div className="flex items-center justify-center gap-4 mt-2 text-sm text-green-700">
                      <a href="/profile/followers" className="hover:underline"><span className="font-semibold">{socialCounts.followers}</span> Followers</a>
                      <span>•</span>
                      <a href="/profile/following" className="hover:underline"><span className="font-semibold">{socialCounts.following}</span> Following</a>
                    </div>

                    {/* Profile Completion */}
                    {typeof user.profileCompletion === "number" && (
                      <div className="w-full space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-green-700 font-medium">Profile Completion</span>
                          <span className="text-green-600 font-bold">{user.profileCompletion}%</span>
                        </div>
                        <div className="w-full bg-green-100 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out shadow-inner"
                            style={{ width: `${user.profileCompletion}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Location (if available) */}
                    {(user.location?.city || user.location?.province) && (
                      <div className="text-center">
                        <p className="text-green-600 text-sm font-medium">
                          {[user.location.city, user.location.province].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Form - Right Side */}
            <div className="lg:col-span-2">
              <Card className="shadow-2xl border-green-200 bg-white/95 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                  <CardTitle className="text-2xl font-bold flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8 bg-white/95 rounded-b-xl">
                  
                  {/* Avatar Upload Section */}
                  {editMode && (
                    <div className="mb-8 p-6 bg-green-50 rounded-xl border-2 border-dashed border-green-200">
                      <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-green-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <Label htmlFor="avatar" className="text-green-700 font-semibold text-lg cursor-pointer hover:text-green-800 transition-colors">
                          Change Profile Picture
                        </Label>
                        <Input
                          id="avatar"
                          name="avatar"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="mt-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        />
                      </div>
                    </div>
                  )}

                  <form
                    className="space-y-8"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSave();
                    }}
                  >
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-emerald-800 mb-2">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-emerald-600 font-semibold">First Name</Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            value={form.firstName}
                            onChange={handleInputChange}
                            disabled={!editMode}
                            required
                            className="bg-emerald-50 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-900 font-medium transition-all duration-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-emerald-600 font-semibold">Last Name</Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            value={form.lastName}
                            onChange={handleInputChange}
                            disabled={!editMode}
                            className="bg-emerald-50 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-900 font-medium transition-all duration-200"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio" className="text-emerald-600 font-semibold">Bio</Label>
                        <textarea
                          id="bio"
                          name="bio"
                          rows="3"
                          value={form.bio}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          placeholder="Tell us about yourself..."
                          className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-emerald-900 font-medium transition-all duration-200 resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactNumber" className="text-emerald-600 font-semibold">Contact Number</Label>
                        <Input
                          id="contactNumber"
                          name="contactNumber"
                          value={form.contactNumber}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          placeholder="e.g. +639123456789"
                          className="bg-emerald-50 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-900 font-medium transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Location Information */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-emerald-800 mb-2">Location</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="address" className="text-emerald-600 font-semibold">Address</Label>
                          <Input
                            id="address"
                            name="location.address"
                            value={form.location.address}
                            onChange={handleInputChange}
                            disabled={!editMode}
                            className="bg-emerald-50 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-900 font-medium transition-all duration-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-emerald-600 font-semibold">City</Label>
                          <Input
                            id="city"
                            name="location.city"
                            value={form.location.city}
                            onChange={handleInputChange}
                            disabled={!editMode}
                            className="bg-emerald-50 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-900 font-medium transition-all duration-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="province" className="text-emerald-600 font-semibold">Province</Label>
                          <Input
                            id="province"
                            name="location.province"
                            value={form.location.province}
                            onChange={handleInputChange}
                            disabled={!editMode}
                            className="bg-emerald-50 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-900 font-medium transition-all duration-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zipCode" className="text-emerald-600 font-semibold">Zip Code</Label>
                          <Input
                            id="zipCode"
                            name="location.zipCode"
                            value={form.location.zipCode}
                            onChange={handleInputChange}
                            disabled={!editMode}
                            className="bg-emerald-50 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-900 font-medium transition-all duration-200"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-emerald-800 mb-2">Social Links</h3>
                      <div className="space-y-2">
                        {editMode ? (
                          <>
                            {form.socialLinks.map((link, idx) => (
                              <div key={idx} className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 flex flex-col md:flex-row items-center gap-4">
                                <div className="flex-shrink-0 w-full md:w-auto flex items-center gap-2">
                                  <select
                                    value={link.platform}
                                    onChange={e => handleSocialLinkChange(idx, 'platform', e.target.value)}
                                    className="border border-emerald-200 rounded-md px-2 py-1 text-emerald-900 bg-white"
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
                                </div>
                                <input
                                  type="text"
                                  value={link.displayName}
                                  onChange={e => handleSocialLinkChange(idx, 'displayName', e.target.value)}
                                  placeholder="Display Name"
                                  className="flex-1 border border-emerald-200 rounded-md px-2 py-1 text-emerald-900 bg-white"
                                />
                                <input
                                  type="url"
                                  value={link.url}
                                  onChange={e => handleSocialLinkChange(idx, 'url', e.target.value)}
                                  placeholder="https://..."
                                  className="flex-1 border border-emerald-200 rounded-md px-2 py-1 text-emerald-900 bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeSocialLink(idx)}
                                  className="text-red-600 hover:text-red-800 font-bold px-2 py-1 rounded"
                                  title="Remove"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={addSocialLink}
                              className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                            >
                              + Add Social Link
                            </button>
                          </>
                        ) : (
                          <>
                            {form.socialLinks.map((link, idx) => (
                              <div key={idx} className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-4">
                                <div className="flex-shrink-0">{getSocialIcon(link.platform)}</div>
                                <div className="flex-1">
                                  <div className="text-emerald-900 font-semibold text-sm">{link.displayName || link.platform}</div>
                                  <div className="text-emerald-900 text-xs truncate">{link.url}</div>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6 border-t border-green-200">
                      {!editMode ? (
                        <Button
                          type="button"
                          onClick={handleEdit}
                          className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Profile
                        </Button>
                      ) : (
                        <>
                          <Button
                            type="button"
                            onClick={handleCancel}
                            className="flex-1 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={loading || !isFormChanged()}
                            className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            {loading ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Save Changes
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* My Campaigns Section */}
              <Card className="shadow-2xl border-green-200 bg-white/95 backdrop-blur-sm mt-8">
                <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                  <CardTitle className="text-2xl font-bold flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                    </svg>
                    My Campaigns
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {loadingCampaigns ? (
                    <div className="text-green-700">Loading campaigns...</div>
                  ) : myCampaigns.length === 0 ? (
                    <div className="text-green-700">You haven't created any campaigns yet.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {myCampaigns.map((c) => (
                        <div key={c._id} className="border rounded-lg overflow-hidden bg-white shadow">
                          {c.image && (
                            <img src={c.image} alt={c.title} className="w-full h-40 object-cover" />
                          )}
                          <div className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-emerald-800 truncate">{c.title}</h4>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${c.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.verified ? 'Verified' : 'Pending'}</span>
                            </div>
                            {c.description && (
                              <p className="text-sm text-emerald-700 line-clamp-2">{c.description}</p>
                            )}
                            <div className="flex items-center justify-between text-sm text-emerald-600">
                              <span className="capitalize">{c.type}</span>
                              <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                              <a href={`/campaigns/${c._id}`} className="px-3 py-1 rounded-md border border-emerald-300 text-emerald-700 hover:bg-emerald-50">View</a>
                              <button
                                onClick={async () => {
                                  if (!window.confirm('Delete this campaign? This cannot be undone.')) return;
                                  try {
                                    const token = localStorage.getItem('token');
                                    await axios.delete(`/api/campaigns/${c._id}`, { headers: { Authorization: `Bearer ${token}` } });
                                    setMyCampaigns((prev) => prev.filter((x) => x._id !== c._id));
                                    toast.success('Campaign deleted');
                                  } catch (e) {
                                    console.error(e);
                                    toast.error('Failed to delete campaign');
                                  }
                                }}
                                className="px-3 py-1 rounded-md border border-red-300 text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Profile;