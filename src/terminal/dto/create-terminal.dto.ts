import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateTerminalDto {
    @IsString()
    @IsNotEmpty()
    mpTerminalId: string;

    @IsString()
    @IsOptional()
    mpExternalPosId?: string;

    @IsString()
    @IsOptional()
    alias?: string;
}
