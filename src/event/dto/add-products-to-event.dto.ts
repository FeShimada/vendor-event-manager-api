import { IsArray, IsNotEmpty, IsUUID } from "class-validator";


export class AddProductsToEventDto {
    @IsArray()
    @IsUUID('4', { each: true })
    @IsNotEmpty()
    productIds: string[];
}
