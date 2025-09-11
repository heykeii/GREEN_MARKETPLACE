import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Likes localStorage helpers
// Stores an array of campaign ids that this browser has liked at least once
const LIKED_KEY = 'likedCampaignIds';

export function getLikedCampaignIds() {
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

export function setLikedForCampaign(campaignId, liked) {
  try {
    const ids = new Set(getLikedCampaignIds().map(String));
    const id = String(campaignId);
    if (liked) {
      ids.add(id);
    } else {
      ids.delete(id);
    }
    localStorage.setItem(LIKED_KEY, JSON.stringify(Array.from(ids)));
  } catch (_) {
    // ignore storage errors
  }
}