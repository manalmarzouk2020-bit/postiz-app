import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { SalesLeadsService } from '@gitroom/nestjs-libraries/database/prisma/sales-brain/leads.service';
import { OpenaiService } from '@gitroom/nestjs-libraries/openai/openai.service';
import { AskSalesBrainDto } from '@gitroom/nestjs-libraries/dtos/sales-brain/ask.dto';

@ApiTags('Sales Brain')
@Controller('/sales-brain/ask')
export class SalesBrainAskController {
  constructor(
    private _leadsService: SalesLeadsService,
    private _openaiService: OpenaiService
  ) {}

  @Post('/')
  async ask(
    @GetOrgFromRequest() org: Organization,
    @Body() body: AskSalesBrainDto
  ) {
    const summary = await this._leadsService.getBusinessDataSummary(org.id);
    const answer = await this._openaiService.answerSalesBrainQuestion(
      org.name,
      summary,
      body.question
    );
    return { answer };
  }
}
