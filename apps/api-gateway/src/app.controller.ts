import { 
  Controller, 
  Post, 
  Body, 
  UseInterceptors, 
  UploadedFile, 
  Logger, 
  UseGuards 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';
import { DashboardGateway } from './gateways/dashboard.gateway';
import { BudgetAuthGuard } from './auth/auth.guard';

@Controller('costs')
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly dashboardGateway: DashboardGateway,
  ) {}

  @Post('upload')
  async uploadOne(@Body() data: any) {
    this.logger.log(`Incoming cost request for: ${data.firstName}`);
    return this.appService.sendCostEvent(data);
  }

  @UseGuards(BudgetAuthGuard)
  @Post('upload-csv')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsv(@UploadedFile() file: any) {
    if (!file) {
      this.logger.error('Upload attempt failed: No file present.');
      return { error: 'No file uploaded' };
    }

    const csvData = file.buffer.toString();
    const rows = csvData.split('\n').filter(row => row.trim() !== '').slice(1); 

    rows.forEach(row => {
      const columns = row.split(',');
      if (columns.length >= 6) {
        const [company, department, firstName, lastName, description, amount] = columns;
        
        this.appService.sendCostEvent({
          company: company.trim(),
          department: department.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          description: description.trim(),
          amount: parseFloat(amount) || 0
        });
      }
    });

    this.logger.log(`Bulk processing initiated for ${rows.length} records.`);
    return { status: `Processing ${rows.length} records in parallel.` };
  }

  /**
   * Listening for the Python AI results via RabbitMQ 
   * and pushing to the React Frontend via DashboardGateway
   */
  @EventPattern('ai_result')
  handleAi(@Payload() data: any) {
    const payload = data.data || data;
    this.logger.log(`--- 🤖 AI FEEDBACK RECEIVED --- User: ${payload.user}`);
    
    // Broadcast the event to all connected Socket.io clients
    this.dashboardGateway.server.emit('ai_update', data);
  }
}