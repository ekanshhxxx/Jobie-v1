'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Mail, Link as LinkIcon, Edit } from 'lucide-react';
import { User, Profile } from './types';
import { API_BASE_URL } from '../lib/api';

type ProfileHeaderProps = {
  user: User;
  profile: Profile;
  editHref?: string;
};

function normalizeExternalUrl(raw?: string | null): string {
  if (!raw) return '';
  const value = raw.trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function readableUrl(raw?: string | null): string {
  const normalized = normalizeExternalUrl(raw);
  if (!normalized) return '';
  return normalized.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

export default function ProfileHeader({ user, profile, editHref }: ProfileHeaderProps) {
  const avatarSrc = profile.avatarUrl
    ? (profile.avatarUrl.startsWith('http') ? profile.avatarUrl : `${API_BASE_URL}${profile.avatarUrl}`)
    : '';
  const websiteUrl = normalizeExternalUrl(profile.website);
  const linkedinUrl = normalizeExternalUrl(profile.linkedin);
  const websiteLabel = readableUrl(profile.website);
  const linkedinLabel = readableUrl(profile.linkedin);

  return (
    <div className="relative bg-white/60 dark:bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-[0_12px_30px_rgba(0,0,0,0.08)] border border-white/30">
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/50 dark:via-purple-900/50 dark:to-pink-900/50 rounded-t-2xl"></div>
      <div className="relative flex flex-col md:flex-row items-start gap-8">
        <div className="relative group shrink-0">
          <Image
            src={avatarSrc || "https://i.pravatar.cc/300?img=33"}
            alt={user.name}
            width={128}
            height={128}
            className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-md"
          />
        </div>
        <div className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
              <p className="text-lg text-blue-600 dark:text-blue-400 font-medium mt-1">{profile.headline}</p>
            </div>
            {editHref && (
              <Link
                href={editHref}
                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mt-4 md:mt-0"
              >
                <Edit size={16} />
                <span>Edit Profile</span>
              </Link>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
            {profile.location && (
              <div className="flex items-center gap-2">
                <MapPin size={14} />
                <span>{profile.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Mail size={14} />
              <a href={`mailto:${user.email}`} className="hover:text-blue-600 dark:hover:text-blue-400">{user.email}</a>
            </div>
            {websiteUrl && (
              <div className="flex items-center gap-2">
                <LinkIcon size={14} />
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 break-all">{websiteLabel}</a>
              </div>
            )}
            {linkedinUrl && (
              <div className="flex items-center gap-2">
                <LinkIcon size={14} />
                <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 break-all">{linkedinLabel}</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
