// dto/category.dto.ts - CORRECTED VERSION
import { 
  IsString, 
  IsOptional, 
  IsBoolean, 
  IsInt, 
  Min, 
  ValidateIf,
  IsNotEmpty
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
    // Handle ColorPicker returning Color object or different formats
    if (!value) return undefined;
    
    // If it's an object with toHexString method (Ant Design ColorPicker)
    if (typeof value === 'object' && value.toHexString) {
      return value.toHexString();
    }
    
    // If it's an object with hex property
    if (typeof value === 'object' && value.hex) {
      return value.hex;
    }
    
    // If it's already a string
    if (typeof value === 'string') {
      // Ensure it starts with #
      return value.startsWith('#') ? value : `#${value}`;
    }
    
    return value;
  })
  @ValidateIf(o => o.color !== undefined)
  @IsString({ message: 'Color must be a string' })
  color?: string;

  @IsOptional()
  @Transform(({ value }) => {
    // Handle checkbox value transformation
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
    // Handle ColorPicker returning Color object or different formats
    if (!value) return undefined;
    
    // If it's an object with toHexString method (Ant Design ColorPicker)
    if (typeof value === 'object' && value.toHexString) {
      return value.toHexString();
    }
    
    // If it's an object with hex property
    if (typeof value === 'object' && value.hex) {
      return value.hex;
    }
    
    // If it's already a string
    if (typeof value === 'string') {
      // Ensure it starts with #
      return value.startsWith('#') ? value : `#${value}`;
    }
    
    return value;
  })
  @ValidateIf(o => o.color !== undefined)
  @IsString({ message: 'Color must be a string' })
  color?: string;

  @IsOptional()
  @Transform(({ value }) => {
    // Handle checkbox value transformation
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
}