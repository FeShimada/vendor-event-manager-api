import { IsArray, IsNotEmpty, IsUUID } from "class-validator";


export class AddProductsToEventDto {
    @IsUUID()
    @IsNotEmpty()
    eventId: string;

    @IsArray()
    @IsUUID('4', { each: true })
    @IsNotEmpty()
    productIds: string[];
}
