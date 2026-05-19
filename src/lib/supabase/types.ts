export interface DatabaseProfile {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseFlow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  canvas_data: {
    nodes: any[];
    edges: any[];
  };
  theme: string;
  node_count: number;
  is_pinned: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface FlowListItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  nodeCount: number;
  isPinned: boolean;
  isFavorite: boolean;
  updatedAt: string;
  createdAt: string;
}
