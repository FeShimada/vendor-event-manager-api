import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateEmployeeDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    email: string;

    @IsString()
    @IsOptional()
    phone?: string;
}
