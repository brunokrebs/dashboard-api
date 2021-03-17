import {
  Controller,
  Query,
  Get,
  Param,
  Body,
  Post,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Pagination } from 'nestjs-typeorm-paginate';
import { parseBoolean } from '../util/parsers';
import { InventoryService } from './inventory.service';
import { Inventory } from './inventory.entity';
import { InventoryMovementDTO } from './inventory-movement.dto';
import { InventoryMovement } from './inventory-movement.entity';
import { InventoryDTO } from './inventory.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  async listInventories(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('sortedBy') sortedBy: string,
    @Query('sortDirectionAscending') sortDirectionAscending: string,
    @Query('query') query: string,
  ): Promise<Pagination<InventoryDTO>> {
    const result = await this.inventoryService.paginate({
      page,
      limit,
      sortedBy,
      sortDirectionAscending: parseBoolean(sortDirectionAscending),
      queryParams: [
        {
          key: 'query',
          value: query,
        },
      ],
    });
    const paginatedResults = {
      ...result,
      items: result.items.map(inventory => {
        return {
          id: inventory.id,
          productVariationDetails: {
            parentSku: inventory.productVariation.product.sku,
            sku: inventory.productVariation.sku,
            sellingPrice: inventory.productVariation.sellingPrice,
            title: inventory.productVariation.product.title,
            description: inventory.productVariation.description,
            currentPosition: inventory.productVariation.currentPosition,
            thumbnail: inventory.productVariation.product.thumbnail,
          },
          currentPosition: inventory.currentPosition,
        };
      }),
    };
    return Promise.resolve(paginatedResults);
  }

  @Get('/report')
  async exportXls(
    @Query('category') category,
    @Query('xlsx') xlsx: string,
    @Res() res: Response,
  ) {
    const asXLSX = parseBoolean(xlsx);
    const response = await this.inventoryService.exportXls(category, asXLSX);
    console.log(response);
    res.status(HttpStatus.OK).send(response);
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Inventory> {
    return this.inventoryService.findById(id);
  }

  @Post('/movement')
  async save(
    @Body() inventoryMovementDTO: InventoryMovementDTO,
  ): Promise<InventoryMovement> {
    return this.inventoryService.createNewMovement(inventoryMovementDTO);
  }
}
