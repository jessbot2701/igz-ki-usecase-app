import { apiClient } from './client';
import { ChampionOption } from '../types';

export const championApi = {
  list: () => apiClient.get<ChampionOption[]>('/champions').then((response) => response.data)
};
