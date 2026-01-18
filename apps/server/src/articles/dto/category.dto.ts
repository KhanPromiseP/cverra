// dto/category.dto.ts
import { 
  IsString, 
  IsOptional, 
  IsBoolean, 
  IsInt, 
  Min, 
  ValidateIf,
  IsNotEmpty,
  IsArray
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateCategoryDto {
  @IsString({ message: 'Category name must be a string' })
  @IsNotEmpty({ message: 'Category name is required' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    
    if (typeof value === 'object' && value.toHexString) {
      return value.toHexString();
    }
    
    if (typeof value === 'object' && value.hex) {
      return value.hex;
    }
    
    if (typeof value === 'string') {
      return value.startsWith('#') ? value : `#${value}`;
    }
    
    return value;
  })
  @ValidateIf(o => o.color !== undefined)
  @IsString({ message: 'Color must be a string' })
  color?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1 || value === '1') {
      return true;
    }
    if (value === 'false' || value === false || value === 0 || value === '0') {
      return false;
    }
    return value;
  })
  @Type(() => Boolean)
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean = true;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Order must be an integer' })
  @Min(0, { message: 'Order must be at least 0' })
  order?: number;

  // Translation fields
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'autoTranslate must be a boolean' })
  autoTranslate?: boolean = true;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(lang => lang.trim());
    }
    return value;
  })
  targetLanguages?: string[] = ['fr', 'es', 'de'];
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString({ message: 'Category name must be a string' })
  @IsNotEmpty({ message: 'Category name cannot be empty' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    
    if (typeof value === 'object' && value.toHexString) {
      return value.toHexString();
    }
    
    if (typeof value === 'object' && value.hex) {
      return value.hex;
    }
    
    if (typeof value === 'string') {
      return value.startsWith('#') ? value : `#${value}`;
    }
    
    return value;
  })
  @ValidateIf(o => o.color !== undefined)
  @IsString({ message: 'Color must be a string' })
  color?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1 || value === '1') {
      return true;
    }
    if (value === 'false' || value === false || value === 0 || value === '0') {
      return false;
    }
    return value;
  })
  @Type(() => Boolean)
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Order must be an integer' })
  @Min(0, { message: 'Order must be at least 0' })
  order?: number;

  // Translation fields
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'autoTranslate must be a boolean' })
  autoTranslate?: boolean;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(lang => lang.trim());
    }
    return value;
  })
  targetLanguages?: string[];
}