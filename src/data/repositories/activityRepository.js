import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityModel } from '../models/ActivityModel';

const STORAGE_KEY = '@striveapp_activities';

/**
 * Repository for Activity CRUD operations.
 * Uses AsyncStorage as the persistence layer.
 */
export const ActivityRepository = {
  /** Save a new activity */
  async saveActivity(activity) {
    const activities = await this.getAllActivities();
    activities.unshift(activity); // newest first
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(activities.map((a) => a.toJSON())));
  },

  /** Get all activities, newest first */
  async getAllActivities() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return parsed.map((json) => ActivityModel.fromJSON(json));
    } catch (e) {
      console.error('ActivityRepository.getAllActivities error:', e);
      return [];
    }
  },

  /** Get a single activity by ID */
  async getActivityById(id) {
    const activities = await this.getAllActivities();
    return activities.find((a) => a.id === id) || null;
  },

  /** Delete an activity by ID */
  async deleteActivity(id) {
    const activities = await this.getAllActivities();
    const filtered = activities.filter((a) => a.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.map((a) => a.toJSON())));
  },

  /** Clear all activities */
  async clearAll() {
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
};
