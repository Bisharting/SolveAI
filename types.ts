
// Domain types based on the JSON schema provided in the prompt

export type SolutionType = 'new' | 'existing' | 'both';

export interface TargetPersona {
  name: string;
  description: string;
  primary_needs: string[];
}

export interface SuccessRating {
  score: number;
  scale: string;
  justification: string;
}

export interface DesignConsiderations {
  materials_or_tech: string[];
  estimated_complexity: 'low' | 'medium' | 'high';
  estimated_cost_level: 'low' | 'medium' | 'high';
}

export interface GeneratedConcept {
  id: number;
  name: string;
  type: 'product' | 'service' | 'method'; // Added type
  one_line_pitch: string;
  detailed_description: string;
  key_features: string[];
  user_benefits: string[];
  target_personas: TargetPersona[];
  risks_and_limitations: string[];
  monetization_strategies: string[];
  success_rating: SuccessRating;
  design_considerations: DesignConsiderations;
  image_prompt: string;
  tags: string[];
}

export interface ExistingSolution {
  id: number;
  name: string;
  description: string;
  why_it_works: string;
  real_world_example: string; // Specific company or historical example
  limitations: string[];
  efficacy_rating: number; // 0-100 based on general success
}

export interface ProblemUnderstanding {
  summary: string;
  root_cause: string; // Added root cause
  assumptions: string[];
  design_goals: string[];
}

export interface OverallRecommendations {
  best_approach: string; // Renamed from most_promising_concept_id to text summary or ID
  reason: string;
  suggested_next_steps: string[];
}

export interface SolverResponse {
  problem_understanding: ProblemUnderstanding;
  existing_solutions: ExistingSolution[]; // Populated if 'existing' or 'both'
  generated_concepts: GeneratedConcept[]; // Populated if 'new' or 'both'
  overall_recommendations: OverallRecommendations;
}

export interface UserInput {
  problemDescription: string;
  domain: string;
  solutionType: SolutionType; // Added
  constraints: string;
  numConcepts: number;
}

export interface MarketNiche {
  name: string;
  description: string;
  competition_level: 'low' | 'medium' | 'high';
  potential_gap: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Competitor {
  name: string;
  product_name: string;
  key_overlap: string;
  weakness: string;
}

export interface CompetitorAnalysis {
  competitors: Competitor[];
  differentiation_opportunities: string[];
  verdict: string;
}

export interface SearchSource {
  title: string;
  uri: string;
}

export interface CompetitorAnalysisResult {
  data: CompetitorAnalysis;
  sources: SearchSource[];
}
