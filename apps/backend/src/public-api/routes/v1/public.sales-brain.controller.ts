import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { SalesLeadsService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/leads.service';
import { SalesProductsService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/products.service';
import { SalesBrainEngineService } from '@gitroom/nestjs-libraries/sales-brain/sales-brain-engine.service';
import {
  CreateLeadDto,
  SendMessageDto,
} from '@gitroom/nestjs-libraries/dtos/sales-brain/lead.dto';

/**
 * External CRM/Zapier/Make/n8n integration surface (master spec section 32),
 * authenticated by the organization's API key via the Authorization header
 * (same PublicAuthMiddleware every other /public/v1 route uses).
 */
@ApiTags('Public API')
@Controller('/public/v1/sales-brain')
export class PublicSalesBrainController {
  constructor(
    private _leadsService: SalesLeadsService,
    private _productsService: SalesProductsService,
    private _salesBrainEngine: SalesBrainEngineService
  ) {}

  @Get('/leads')
  getLeads(@GetOrgFromRequest() org: Organization) {
    return this._leadsService.getLeads(org.id);
  }

  @Get('/leads/:id')
  getLead(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this._leadsService.getLead(org.id, id);
  }

  @Post('/leads')
  createLead(@GetOrgFromRequest() org: Organization, @Body() body: CreateLeadDto) {
    return this._leadsService.createLead(org.id, body);
  }

  @Post('/leads/:id/messages')
  sendMessage(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: SendMessageDto
  ) {
    return this._salesBrainEngine.processIncomingMessage(
      org.id,
      id,
      org.name,
      body.content
    );
  }

  @Get('/products')
  getProducts(@GetOrgFromRequest() org: Organization) {
    return this._productsService.getProducts(org.id);
  }
}
