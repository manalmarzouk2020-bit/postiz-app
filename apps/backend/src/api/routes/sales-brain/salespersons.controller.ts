import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { SalespersonsService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/salespersons.service';
import { CreateSalespersonDto } from '@gitroom/nestjs-libraries/dtos/sales-brain/salesperson.dto';

@ApiTags('Sales Brain')
@Controller('/sales-brain/salespersons')
export class SalesBrainSalespersonsController {
  constructor(private _salespersonsService: SalespersonsService) {}

  @Get('/')
  getSalespersons(@GetOrgFromRequest() org: Organization) {
    return this._salespersonsService.getSalespersons(org.id);
  }

  @Post('/')
  create(@GetOrgFromRequest() org: Organization, @Body() body: CreateSalespersonDto) {
    return this._salespersonsService.create(org.id, body);
  }

  @Post('/:id/coach')
  generateCoachingReport(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this._salespersonsService.generateCoachingReport(org.id, id);
  }
}
