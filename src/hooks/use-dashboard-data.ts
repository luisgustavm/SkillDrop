"use client";

import { useEffect, useMemo, useState } from "react";
import { listenActivities } from "@/services/activity-service";
import { listenFavorites } from "@/services/favorite-service";
import { listenUserUploads } from "@/services/upload-service";
<<<<<<< HEAD
import { isFirebaseConfigured } from "@/firebase/client";
=======
>>>>>>> 5fd6ae362174970f3e29bd386dec61cde1224472
import type { ActivityLog } from "@/types/activity";
import type { Favorite } from "@/types/favorite";
import type { AcademicUpload } from "@/types/upload";

type LoadedState = {
  uploads: boolean;
  favorites: boolean;
  activities: boolean;
};

const initialLoadedState: LoadedState = {
  uploads: false,
  favorites: false,
  activities: false,
};

export function useDashboardData(userId?: string) {
  const [uploads, setUploads] = useState<AcademicUpload[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loaded, setLoaded] = useState(initialLoadedState);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
<<<<<<< HEAD
    if (!userId || !isFirebaseConfigured) {
      setUploads([]);
      setFavorites([]);
      setActivities([]);
      setLoaded(isFirebaseConfigured ? initialLoadedState : { uploads: true, favorites: true, activities: true });
=======
    if (!userId) {
      setUploads([]);
      setFavorites([]);
      setActivities([]);
      setLoaded(initialLoadedState);
>>>>>>> 5fd6ae362174970f3e29bd386dec61cde1224472
      return;
    }

    setError(null);
    setLoaded(initialLoadedState);

    const handleRequiredError = (subscriptionError: Error) => {
      setError(subscriptionError.message);
      setLoaded((state) => ({ ...state, uploads: true }));
    };

    const handleOptionalError = () => {
      setLoaded((state) => ({ ...state, favorites: true, activities: true }));
    };

    const unsubscribeUploads = listenUserUploads(
      userId,
      (items) => {
        setUploads(items);
        setLoaded((state) => ({ ...state, uploads: true }));
      },
      handleRequiredError,
    );
    const unsubscribeFavorites = listenFavorites(
      userId,
      (items) => {
        setFavorites(items);
        setLoaded((state) => ({ ...state, favorites: true }));
      },
      handleOptionalError,
    );
    const unsubscribeActivities = listenActivities(
      userId,
      (items) => {
        setActivities(items);
        setLoaded((state) => ({ ...state, activities: true }));
      },
      handleOptionalError,
    );

    return () => {
      unsubscribeUploads();
      unsubscribeFavorites();
      unsubscribeActivities();
    };
  }, [userId]);

  const stats = useMemo(
    () => ({
      totalUploads: uploads.length,
      totalStorageBytes: uploads.reduce((total, upload) => total + upload.size, 0),
      totalFavorites: favorites.length,
      sharedUploads: uploads.filter((upload) => upload.visibility === "shared").length,
    }),
    [favorites.length, uploads],
  );

  return {
    uploads,
    favorites,
    activities,
    stats,
    loading: !loaded.uploads,
    error,
  };
}
