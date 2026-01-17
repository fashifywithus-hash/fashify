/**
 * Data Transfer Objects for Authentication
 */

export interface SignupRequestDto {
  email: string;
  password: string;
}

export interface SignupResponseDto {
  id: string;
  email: string;
  createdAt: Date;
}

export interface AuthResponseDto extends SignupResponseDto {
  action: 'signup' | 'login';
}

export interface ApiResponseDto<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}
