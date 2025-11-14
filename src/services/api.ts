// services
import { auth } from '../config/firebase';

// types
import { User } from '../types/entities';

/**
 * Base API configuration
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Generic API response interface
 */
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * API client class for backend communication
 */
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Get authentication headers with Firebase ID token
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (auth.currentUser) {
      try {
        // Force fresh token to avoid timing issues
        const token = await auth.currentUser.getIdToken(true);
        headers.Authorization = `Bearer ${token}`;
        
      } catch (error) {
        console.error('❌ Failed to get auth token:', error);
        throw error;
      }
    } else {
      console.warn('⚠️ No authenticated user found');
      throw new Error('No authenticated user');
    }

    return headers;
  };

  /**
   * Make authenticated GET request
   */
  private async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return await response.json();
    } catch (error) {
      console.error(`GET ${endpoint} failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Make authenticated POST request
   */
  private async post<T>(endpoint: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return await response.json();
    } catch (error) {
      console.error(`POST ${endpoint} failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * User API methods
   */
  public user = {
    /**
     * Get current user profile from backend
     */
    getMe: (): Promise<ApiResponse<User>> => {
      return this.get<User>('/users/me');
    },

    /**
     * Set user role (admin only)
     */
    setRole: (uid: string, role: string): Promise<ApiResponse> => {
      return this.post('/users/set-role', { uid, role });
    },

    /**
     * Initialize admin user
     */
    initAdmin: (email: string): Promise<ApiResponse> => {
      return this.post('/users/init-admin', { email });
    },

    /**
     * Get all users (admin only)
     */
    getAll: (): Promise<ApiResponse<User[]>> => {
      return this.get<User[]>('/users');
    },
  };
}

/**
 * Default API client instance
 */
export const apiClient = new ApiClient();

/**
 * User service functions
 */
export const userService = {
  /**
   * Fetch current user data from backend
   * 
   * @returns Promise resolving to user data or null if not found
   */
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await apiClient.user.getMe();
      
      if (response.success && response.data) {
        return response.data;
      }
      
      console.warn('Failed to fetch user data:', response.error);
      return null;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  },

  /**
   * Set admin role for user
   */
  initializeAdmin: async (email: string): Promise<boolean> => {
    try {
      const response = await apiClient.user.initAdmin(email);
      return response.success;
    } catch (error) {
      console.error('Error initializing admin:', error);
      return false;
    }
  },
};

export default apiClient;