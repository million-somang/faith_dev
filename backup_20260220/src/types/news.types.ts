// News 카테고리 타입
export type NewsCategory = 
  | 'general' 
  | 'politics' 
  | 'economy' 
  | 'tech' 
  | 'sports' 
  | 'entertainment'
  | 'stock'

// News 인터페이스
export interface News {
  id: number
  category: NewsCategory
  title: string
  summary?: string
  link: string
  image_url?: string
  publisher?: string
  pub_date?: string
  ai_summary?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  ai_processed?: number
  vote_up: number
  vote_down: number
  view_count: number
  comment_count: number
  popularity_score: number
  created_at: string
  updated_at?: string
  related_stocks?: string  // JSON string
}

// News DTO
export interface FetchNewsDTO {
  category: NewsCategory
  limit?: number
  offset?: number
}

export interface CreateNewsDTO {
  category: NewsCategory
  title: string
  summary?: string
  link: string
  image_url?: string
  publisher?: string
  pub_date?: string
}
