import { IsNotEmpty, IsString } from "class-validator";

export class ChangeOperatingModeDto {

    @IsString()
    @IsNotEmpty()
    operatingMode: string;
}