import { useState, useEffect } from 'react';
import { cmsStore } from '../services/cmsStore';
import { orgInfo, trainingCourses, communityGroups, sponsorsList } from '../data/dcvcData';

/**
 * Normalizes flat CMS settings onto the rich orgInfo shape expected by public pages.
 */
export function buildLiveOrgInfo(settings) {
  const s = settings || {};
  const addressFull =
    typeof s.address === 'string' && s.address.trim()
      ? s.address.trim()
      : s.address?.full || orgInfo.address?.full || '';

  return {
    ...orgInfo,
    ...s,
    voicemailOnly: Boolean(s.voicemailOnly ?? orgInfo.voicemailOnly),
    address: {
      ...(orgInfo.address || {}),
      ...(typeof s.address === 'object' && s.address ? s.address : {}),
      full: addressFull,
      googleMapsUrl: s.googleMapsUrl || orgInfo.address?.googleMapsUrl || ''
    },
    socials: {
      ...(orgInfo.socials || {}),
      facebook: s.facebook || orgInfo.socials?.facebook || '',
      instagram: s.instagram || orgInfo.socials?.instagram || '',
      youtube: s.youtube || orgInfo.socials?.youtube || ''
    }
  };
}

export function useLiveOrgInfo() {
  const [liveOrg, setLiveOrg] = useState(() => buildLiveOrgInfo(cmsStore.getSettings?.()));

  useEffect(() => {
    return cmsStore.subscribe((data) => {
      setLiveOrg(buildLiveOrgInfo(data?.settings || cmsStore.getSettings?.()));
    });
  }, []);

  return liveOrg;
}

export function useLiveTrainings() {
  const [trainings, setTrainings] = useState(() => {
    const list = cmsStore.getTrainings?.();
    return Array.isArray(list) && list.length > 0 ? list : trainingCourses;
  });

  useEffect(() => {
    return cmsStore.subscribe((data) => {
      const next = data?.trainings || cmsStore.getTrainings?.();
      if (Array.isArray(next) && next.length > 0) {
        setTrainings(next);
      }
    });
  }, []);

  return trainings;
}

export function useLiveCommunityGroups() {
  const [groups, setGroups] = useState(() => {
    const list = cmsStore.getCommunityGroups?.();
    return Array.isArray(list) && list.length > 0 ? list : communityGroups;
  });

  useEffect(() => {
    return cmsStore.subscribe((data) => {
      const next = data?.communityGroups || cmsStore.getCommunityGroups?.();
      if (Array.isArray(next) && next.length > 0) {
        setGroups(next);
      }
    });
  }, []);

  return groups;
}

export function useLiveSponsors() {
  const [sponsors, setSponsors] = useState(() => {
    const list = cmsStore.getSponsors?.();
    return Array.isArray(list) && list.length > 0 ? list : sponsorsList;
  });

  useEffect(() => {
    return cmsStore.subscribe((data) => {
      const next = data?.sponsors || cmsStore.getSponsors?.();
      if (Array.isArray(next) && next.length > 0) {
        setSponsors(next);
      }
    });
  }, []);

  return sponsors;
}

