import { IsBoolean, IsNotEmpty, IsUUID } from "class-validator";


export class AddTerminalToEventDto {
    @IsUUID('4')
    @IsNotEmpty()
    terminalId: string;

    @IsBoolean()
    @IsNotEmpty()
    isPrimary: boolean;
}
