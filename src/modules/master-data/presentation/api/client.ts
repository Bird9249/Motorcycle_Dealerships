import type {
  BrandDTO,
  BrandsListQueryDTO,
  ColorDTO,
  ColorsListQueryDTO,
  CreateBrandDTO,
  CreateColorDTO,
  CreateModelDTO,
  ModelDTO,
  ModelsListQueryDTO,
  UpdateBrandDTO,
  UpdateColorDTO,
  UpdateModelDTO,
} from "@/modules/master-data/domain/contracts";
import { config } from "@/shared/lib/config";
import { fetcher } from "@/shared/lib/fetcher";

function appendQuery(
  url: URL,
  params: Record<string, string | undefined>,
) {
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, value);
    }
  }
}

export const masterDataApi = {
  async listBrands(query: BrandsListQueryDTO = {}): Promise<BrandDTO[]> {
    const url = new URL(`${config.apiUrl}/master-data/brands`);
    appendQuery(url, {
      active: query.active,
      name: query.name,
    });
    return fetcher.get<BrandDTO[]>(url.toString());
  },

  async getBrand(id: string): Promise<BrandDTO> {
    return fetcher.get<BrandDTO>(`${config.apiUrl}/master-data/brands/${id}`);
  },

  async createBrand(input: CreateBrandDTO): Promise<BrandDTO> {
    return fetcher.post<BrandDTO>(`${config.apiUrl}/master-data/brands`, input);
  },

  async updateBrand(id: string, input: UpdateBrandDTO): Promise<BrandDTO> {
    return fetcher.put<BrandDTO>(
      `${config.apiUrl}/master-data/brands/${id}`,
      input,
    );
  },

  async updateBrandStatus(id: string, isActive: boolean): Promise<BrandDTO> {
    return fetcher.patch<BrandDTO>(
      `${config.apiUrl}/master-data/brands/${id}/status`,
      { isActive },
    );
  },

  async listModels(query: ModelsListQueryDTO = {}): Promise<ModelDTO[]> {
    const url = new URL(`${config.apiUrl}/master-data/models`);
    appendQuery(url, {
      active: query.active,
      name: query.name,
      brandId: query.brandId,
      vehicleType: query.vehicleType,
    });
    return fetcher.get<ModelDTO[]>(url.toString());
  },

  async getModel(id: string): Promise<ModelDTO> {
    return fetcher.get<ModelDTO>(`${config.apiUrl}/master-data/models/${id}`);
  },

  async createModel(input: CreateModelDTO): Promise<ModelDTO> {
    return fetcher.post<ModelDTO>(`${config.apiUrl}/master-data/models`, input);
  },

  async updateModel(id: string, input: UpdateModelDTO): Promise<ModelDTO> {
    return fetcher.put<ModelDTO>(
      `${config.apiUrl}/master-data/models/${id}`,
      input,
    );
  },

  async updateModelStatus(id: string, isActive: boolean): Promise<ModelDTO> {
    return fetcher.patch<ModelDTO>(
      `${config.apiUrl}/master-data/models/${id}/status`,
      { isActive },
    );
  },

  async listColors(query: ColorsListQueryDTO = {}): Promise<ColorDTO[]> {
    const url = new URL(`${config.apiUrl}/master-data/colors`);
    appendQuery(url, {
      active: query.active,
      name: query.name,
    });
    return fetcher.get<ColorDTO[]>(url.toString());
  },

  async getColor(id: string): Promise<ColorDTO> {
    return fetcher.get<ColorDTO>(`${config.apiUrl}/master-data/colors/${id}`);
  },

  async createColor(input: CreateColorDTO): Promise<ColorDTO> {
    return fetcher.post<ColorDTO>(`${config.apiUrl}/master-data/colors`, input);
  },

  async updateColor(id: string, input: UpdateColorDTO): Promise<ColorDTO> {
    return fetcher.put<ColorDTO>(
      `${config.apiUrl}/master-data/colors/${id}`,
      input,
    );
  },

  async updateColorStatus(id: string, isActive: boolean): Promise<ColorDTO> {
    return fetcher.patch<ColorDTO>(
      `${config.apiUrl}/master-data/colors/${id}/status`,
      { isActive },
    );
  },
};
