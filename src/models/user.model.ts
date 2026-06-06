/** User and Auth types matching the backend entity structure */

export enum Role {
  CLIENTE = "cliente",
  CAIXA = "caixa",
  VENDEDOR = "vendedor",
  GERENTE = "gerente",
  ADMINISTRADOR = "administrador",
}

export interface User {
  cpf: string;
  nome: string | null;
  email: string;
  telefone: string | null;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface RegisterRequest {
  cpf: string;
  nome?: string;
  email: string;
  senha: string;
  telefone?: string;
  endereco?: AddressInput;
}

export interface AddressInput {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface Address extends AddressInput {
  id: number;
  cpf_pessoa: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
