/**
 * Data Transfer Objects for Authentication
 */

export interface SignupRequestDto {
  phoneNumber: string;
  password: string;
}

export interface SignupResponseDto {
  id: string;
  phoneNumber: string;
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
