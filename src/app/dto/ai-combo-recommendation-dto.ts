import { AiRecommendedProductDTO } from './ai-recommended-product-dto';

export interface AiComboRecommendationDTO {
  titulo: string;
  razon: string;
  precioEstimado: number;
  productos: AiRecommendedProductDTO[];
}
