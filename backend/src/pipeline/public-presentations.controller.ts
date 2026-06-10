import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PresentationsService } from './presentations.service';
import type { PresentationEngagementEvent } from './presentation.types';

@Controller('presentations/public')
export class PublicPresentationsController {
  constructor(private readonly presentations: PresentationsService) {}

  @Get(':shareToken')
  getPublic(@Param('shareToken') shareToken: string, @Query('preview') preview?: string) {
    return this.presentations.getPublicByShareToken(shareToken, preview === '1');
  }

  @Post(':shareToken/accept-terms')
  acceptTerms(@Param('shareToken') shareToken: string) {
    return this.presentations.acceptTerms(shareToken);
  }

  @Post(':shareToken/request-interview')
  requestInterview(@Param('shareToken') shareToken: string) {
    return this.presentations.requestInterview(shareToken);
  }

  @Post(':shareToken/engagement')
  recordEngagement(
    @Param('shareToken') shareToken: string,
    @Body() body: { event?: PresentationEngagementEvent; preview?: boolean },
  ) {
    const event = body.event;
    if (event !== 'viewed' && event !== 'export_pdf') {
      throw new BadRequestException('event must be "viewed" or "export_pdf".');
    }
    return this.presentations.recordEngagement(shareToken, event, Boolean(body.preview));
  }
}
