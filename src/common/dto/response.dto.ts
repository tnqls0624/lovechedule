import { ApiProperty } from "@nestjs/swagger";

export class ResponseDto {
  @ApiProperty({
    required: true,
    example: true,
    description: "success",
  })
  success: boolean;

  @ApiProperty({
    required: true,
    example: [{}],
    description: "data",
  })
  data: object[];

  @ApiProperty({
    required: true,
    example: "2022-04-21 09:50:24",
    description: "string",
  })
  timestamp: string;
}
