import { AiComboRecommendationDTO } from './ai-combo-recommendation-dto';

export interface AiRecommendationResponseDTO {
  recomendaciones: AiComboRecommendationDTO[];
  aviso: string;
  origen: string;
}
