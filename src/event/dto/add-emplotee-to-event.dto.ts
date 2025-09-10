import { EventEmployeeRole } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";

export class AddEmployeeToEventDto {
    @IsString()
    @IsNotEmpty()
    @IsUUID('4')
    employeeId: string;

    @IsString()
    @IsNotEmpty()
    @IsEnum(EventEmployeeRole)
    role: EventEmployeeRole;

    @IsNumber()
    @IsNotEmpty()
    expense: number;

    @IsString()
    @IsOptional()
    password?: string;
}