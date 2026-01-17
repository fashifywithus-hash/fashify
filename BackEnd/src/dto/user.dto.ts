/**
 * Data Transfer Objects for User Personal Information
 */

export interface PersonalInfoRequestDto {
  _id: string;
  name?: string;
  gender?: 'Male' | 'Female' | 'Other';
  location?: string;
  bodyType?: string;
  height?: string;
  goToStyle?: string;
  userPic?: string;
}

export interface PersonalInfoResponseDto {
  _id: string;
  name?: string;
  gender?: string;
  location?: string;
  bodyType?: string;
  height?: string;
  goToStyle?: string;
  userPic?: string;
  updatedAt: Date;
}

export interface WardrobeItemDto {
  image: string;
}

export interface WardrobeResponseDto {
  title: string;
  description: string;
  wardrobe: WardrobeItemDto[];
}
